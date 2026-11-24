-- Capacity Connect starter schema. Apply in Supabase SQL editor after reviewing.
create extension if not exists vector with schema extensions;
create type public.app_role as enum ('trainee', 'trainer', 'admin');
create type public.question_status as enum ('draft', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'trainee',
  job_title text,
  created_at timestamptz not null default now()
);
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text not null,
  level text not null default 'foundation',
  trainer_id uuid references public.profiles(id),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  trainee_id uuid not null references public.profiles(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  enrolled_at timestamptz not null default now(),
  unique(course_id, trainee_id)
);
create table public.course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  storage_path text not null,
  mime_type text,
  created_at timestamptz not null default now()
);
create table public.document_chunks (
  id bigint generated always as identity primary key,
  resource_id uuid not null references public.course_resources(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536),
  page_number integer,
  unique(resource_id, chunk_index)
);
create index document_chunks_embedding_idx on public.document_chunks using hnsw (embedding extensions.vector_cosine_ops);
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  prompt text not null,
  choices jsonb not null,
  answer_index integer not null,
  explanation text,
  difficulty text not null default 'medium'
);
create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  trainee_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);
create table public.ai_chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  recommendation_type text not null check (recommendation_type in ('course', 'trainer', 'skill')),
  rationale text not null,
  score numeric(5,2),
  created_at timestamptz not null default now()
);
create table public.ai_generated_questions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.course_resources(id) on delete set null,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  prompt text not null,
  choices jsonb not null,
  answer_index integer not null,
  explanation text,
  difficulty text not null,
  status public.question_status not null default 'draft',
  created_at timestamptz not null default now()
);
create table public.skill_assessments (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  proficiency numeric(5,2) not null check (proficiency between 0 and 100),
  evidence jsonb not null default '{}'::jsonb,
  assessed_at timestamptz not null default now()
);
create table public.trainer_skills (
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  proficiency numeric(5,2) not null check (proficiency between 0 and 100),
  years_experience numeric(4,1),
  primary key (trainer_id, skill)
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.course_resources enable row level security;
alter table public.document_chunks enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.ai_chat_history enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_generated_questions enable row level security;
alter table public.skill_assessments enable row level security;
alter table public.trainer_skills enable row level security;

-- Starter self-access policies; add role-aware policies before exposing admin/trainer data.
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users read own enrollments" on public.enrollments for select using (auth.uid() = trainee_id);
create policy "Users read own chat" on public.ai_chat_history for select using (auth.uid() = user_id);
create policy "Users write own chat" on public.ai_chat_history for insert with check (auth.uid() = user_id);
create policy "Users read own recommendations" on public.ai_recommendations for select using (auth.uid() = trainee_id);
create policy "Users read own skill assessments" on public.skill_assessments for select using (auth.uid() = trainee_id);

-- Private storage bucket and pgvector RPC used by /api/ai/ingest and /api/ai/chat.
insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', false)
on conflict (id) do nothing;

insert into public.courses (id, title, description, subject, level, published)
values (
  '71a98d53-54ed-4f84-b160-cc111bcab501',
  'Monsoon Dynamics & Forecasting',
  'Demonstration meteorology course for Capacity Connect.',
  'Synoptic Meteorology',
  'foundation',
  true
)
on conflict (id) do nothing;

create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  filter_course_id uuid,
  match_threshold float default 0.25,
  match_count int default 5
)
returns table (
  resource_id uuid,
  content text,
  page_number integer,
  similarity float
)
language sql
stable
as $$
  select
    chunks.resource_id,
    chunks.content,
    chunks.page_number,
    (1 - (chunks.embedding <=> query_embedding))::float as similarity
  from public.document_chunks as chunks
  where chunks.course_id = filter_course_id
    and chunks.embedding is not null
    and 1 - (chunks.embedding <=> query_embedding) >= match_threshold
  order by chunks.embedding <=> query_embedding
  limit least(match_count, 20);
$$;
