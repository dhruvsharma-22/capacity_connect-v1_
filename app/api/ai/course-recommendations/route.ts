import { AIConfigurationError, aiErrorResponse, createAIResponse } from "@/lib/ai/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { skillGaps?: unknown; courses?: unknown };
    if (!Array.isArray(body.skillGaps) || !Array.isArray(body.courses) || !body.courses.length) {
      return Response.json({ error: "Provide skill gaps and available courses." }, { status: 400 });
    }
    const skillGaps = body.skillGaps.filter((item): item is string => typeof item === "string").slice(0, 12);
    const courses = body.courses.filter((item): item is { id:string; title:string; subject:string } =>
      typeof item === "object" && item !== null && "id" in item && typeof item.id === "string" && "title" in item && typeof item.title === "string" && "subject" in item && typeof item.subject === "string",
    ).slice(0, 30);
    try {
      const output = await createAIResponse({
        instructions: "Recommend courses that address the trainee's skill gaps. Use only supplied course details. Return only JSON {\"recommendations\":[{\"id\":string,\"reason\":string,\"score\":number}]}. Rank strongest fit first, score from 0 to 100.",
        input: JSON.stringify({ skillGaps, courses }),
        maxOutputTokens: 700,
      });
      const parsed = JSON.parse(output.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (!Array.isArray(parsed.recommendations)) throw new Error("Invalid course recommendation response");
      const recommendations = parsed.recommendations.flatMap((item: {id?:unknown;reason?:unknown;score?:unknown}) => {
        const course = courses.find((candidate) => candidate.id === item.id);
        return course ? [{ ...course, reason: String(item.reason || "Relevant to your learning goals"), score: Math.max(0, Math.min(100, Number(item.score) || 0)) }] : [];
      }).sort((a: {score:number}, b: {score:number}) => b.score - a.score);
      return Response.json({ recommendations, mode: "ai" });
    } catch (error) {
      if (!(error instanceof AIConfigurationError)) throw error;
      const gaps = skillGaps.join(" ").toLowerCase();
      const recommendations = courses.map((course) => {
        const words = `${course.title} ${course.subject}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        const matched = words.filter((word) => gaps.includes(word)).length;
        return { ...course, score: Math.min(95, 55 + matched * 12), reason: matched ? `Covers ${words.filter((word) => gaps.includes(word)).join(", ")}` : "Builds a complementary meteorology skill" };
      }).sort((a, b) => b.score - a.score);
      return Response.json({ recommendations, mode: "local" });
    }
  } catch (error) {
    return aiErrorResponse(error);
  }
}
