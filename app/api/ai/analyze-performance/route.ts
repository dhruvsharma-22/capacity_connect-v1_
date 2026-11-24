import { AIConfigurationError, aiErrorResponse, createAIResponse } from "@/lib/ai/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { results?: unknown };
    if (!Array.isArray(body.results) || body.results.length === 0) {
      return Response.json({ error: "Provide one or more assessment results." }, { status: 400 });
    }
    const results = body.results.filter((row): row is { skill: string; score: number } =>
      typeof row === "object" && row !== null && "skill" in row && typeof row.skill === "string" &&
      "score" in row && typeof row.score === "number" && row.score >= 0 && row.score <= 100,
    ).slice(0, 40);
    if (!results.length) return Response.json({ error: "Assessment scores must be between 0 and 100." }, { status: 400 });

    try {
      const output = await createAIResponse({
        instructions: "Analyze these assessment results for a meteorology trainee. Return only JSON: {\"summary\":string,\"strengths\":string[],\"gaps\":string[],\"nextSteps\":string[]}. Keep recommendations specific to the supplied scores, supportive, and actionable. Do not make high-stakes employment decisions.",
        input: JSON.stringify(results),
        maxOutputTokens: 700,
      });
      const report = JSON.parse(output.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (typeof report.summary !== "string" || !Array.isArray(report.nextSteps)) throw new Error("Invalid performance analysis response");
      return Response.json({ ...report, mode: "ai" });
    } catch (error) {
      if (!(error instanceof AIConfigurationError)) throw error;
      const strengths = results.filter((row) => row.score >= 80).map((row) => `${row.skill} (${row.score}%)`);
      const gaps = results.filter((row) => row.score < 70).map((row) => `${row.skill} (${row.score}%)`);
      return Response.json({
        mode: "local",
        summary: gaps.length ? `${gaps.length} skill area(s) could benefit from focused practice.` : "Your current scores show steady progress across the assessed skills.",
        strengths,
        gaps,
        nextSteps: gaps.length ? gaps.map((gap: string) => `Review course material and retake a short assessment for ${gap.split(" (")[0]}.`) : ["Try an advanced assessment to extend your current strengths."],
      });
    }
  } catch (error) {
    return aiErrorResponse(error);
  }
}
