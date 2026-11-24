import { AIConfigurationError, aiErrorResponse, createAIResponse } from "@/lib/ai/openai";

export const runtime = "nodejs";

type Trainer = { id: string; name: string; skills: string[]; experienceYears?: number };

function overlapScore(skills: string[], trainer: Trainer) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  const requested = skills.map(normalize);
  const matched = trainer.skills.filter((skill) => requested.some((need) => need.includes(normalize(skill)) || normalize(skill).includes(need)));
  return Math.round(Math.min(99, (matched.length / Math.max(1, skills.length)) * 82 + Math.min(17, (trainer.experienceYears || 0) * 1.5)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { skills?: unknown; trainers?: unknown };
    if (!Array.isArray(body.skills) || body.skills.length === 0 || !Array.isArray(body.trainers)) {
      return Response.json({ error: "Provide skill goals and trainer profiles." }, { status: 400 });
    }
    const skills = body.skills.filter((value): value is string => typeof value === "string").slice(0, 12);
    const trainers = body.trainers.filter((value): value is Trainer =>
      typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" &&
      "name" in value && typeof value.name === "string" && "skills" in value && Array.isArray(value.skills),
    ).slice(0, 30);

    try {
      const output = await createAIResponse({
        instructions: "Match trainees to trainers based only on the provided skill goals and profiles. Return only JSON: {\"matches\":[{\"id\":string,\"score\":number,\"reason\":string}]}. Score 0-100 and give one brief evidence-based reason per trainer. Do not invent trainer qualifications.",
        input: JSON.stringify({ skillGoals: skills, trainers }),
        maxOutputTokens: 900,
      });
      const parsed = JSON.parse(output.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (!Array.isArray(parsed.matches)) throw new Error("Invalid AI match response");
      const valid = parsed.matches.flatMap((match: { id?: unknown; score?: unknown; reason?: unknown }) => {
        const trainer = trainers.find((item) => item.id === match.id);
        if (!trainer) return [];
        return [{ ...trainer, score: Math.max(0, Math.min(100, Number(match.score) || 0)), reason: String(match.reason || "Skill alignment") }];
      });
      return Response.json({ matches: valid.sort((a: { score: number }, b: { score: number }) => b.score - a.score), mode: "ai" });
    } catch (error) {
      if (!(error instanceof AIConfigurationError)) throw error;
      const matches = trainers
        .map((trainer) => ({ ...trainer, score: overlapScore(skills, trainer), reason: "Skills overlap and experience estimate" }))
        .sort((a, b) => b.score - a.score);
      return Response.json({ matches, mode: "local" });
    }
  } catch (error) {
    return aiErrorResponse(error);
  }
}
