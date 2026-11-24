import { aiErrorResponse, createAIResponse, createEmbedding } from "@/lib/ai/openai";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: unknown;
      courseContext?: unknown;
      courseId?: unknown;
      history?: unknown;
    };

    if (typeof body.question !== "string" || !body.question.trim()) {
      return Response.json({ error: "Enter a question first." }, { status: 400 });
    }
    if (body.question.length > 4000) {
      return Response.json({ error: "Keep your question under 4,000 characters." }, { status: 413 });
    }

    let courseContext = typeof body.courseContext === "string" ? body.courseContext.slice(0, 12_000) : "";
    const courseId = typeof body.courseId === "string" && /^[0-9a-f-]{36}$/i.test(body.courseId) ? body.courseId : null;
    const supabase = getSupabaseAdmin();
    if (supabase && courseId) {
      const embedding = await createEmbedding(body.question.trim());
      const { data, error } = await supabase.rpc("match_document_chunks", {
        query_embedding: embedding,
        filter_course_id: courseId,
        match_threshold: 0.2,
        match_count: 5,
      });
      if (error) throw new Error(`RAG search failed: ${error.message}`);
      if (Array.isArray(data) && data.length) {
        const citations = data.map((chunk: { content: string; resource_id: string; page_number: number | null }, index: number) =>
          `[Source ${index + 1}: resource ${chunk.resource_id}${chunk.page_number ? `, page ${chunk.page_number}` : ""}]\n${chunk.content}`,
        );
        courseContext = [...citations, courseContext].filter(Boolean).join("\n\n").slice(0, 14_000);
      }
    }
    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is { role: "user" | "assistant"; content: string } =>
              typeof item === "object" &&
              item !== null &&
              "role" in item &&
              (item.role === "user" || item.role === "assistant") &&
              "content" in item &&
              typeof item.content === "string",
          )
          .slice(-8)
          .map(({ role, content }) => ({ role, content: content.slice(0, 2000) }))
      : [];

    const answer = await createAIResponse({
      instructions: [
        "You are Capacity Connect's meteorology learning assistant for professional forecasters.",
        "Explain concepts clearly and accurately, using concise steps and examples when useful.",
        "When course material is provided, treat it as the source of truth. Say when the answer is not covered by it; do not invent citations or claim unsupported facts came from the material.",
        "When retrieved snippets are labeled [Source N], cite relevant claims using those exact source labels.",
        "If no course material is provided, answer from general meteorology knowledge and make that distinction clear.",
        courseContext ? `Course material/context:\n${courseContext}` : "No course material was supplied for this question.",
      ].join("\n\n"),
      input: [
        ...history,
        { role: "user", content: body.question.trim() },
      ],
      maxOutputTokens: 700,
    });

    return Response.json({ answer });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
