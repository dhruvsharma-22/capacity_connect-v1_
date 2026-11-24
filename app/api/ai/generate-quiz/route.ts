import { aiErrorResponse, createAIResponse } from "@/lib/ai/openai";

export const runtime = "nodejs";

type QuizQuestion = {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  difficulty: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceText?: unknown;
      courseTitle?: unknown;
      count?: unknown;
      difficulty?: unknown;
    };

    if (typeof body.sourceText !== "string" || body.sourceText.trim().length < 80) {
      return Response.json(
        { error: "Add at least 80 characters of course material before generating questions." },
        { status: 400 },
      );
    }
    if (body.sourceText.length > 14_000) {
      return Response.json({ error: "Keep the source text under 14,000 characters." }, { status: 413 });
    }

    const count = typeof body.count === "number" ? Math.min(10, Math.max(1, Math.floor(body.count))) : 5;
    const difficulty = ["Easy", "Mixed", "Advanced"].includes(String(body.difficulty))
      ? String(body.difficulty)
      : "Mixed";
    const courseTitle = typeof body.courseTitle === "string" ? body.courseTitle.slice(0, 160) : "Course material";

    const result = await createAIResponse({
      instructions: [
        "You create rigorous multiple-choice assessment questions for professional meteorology training.",
        "Use only the supplied source text. Do not test facts absent from it.",
        "Return only a valid JSON object with this shape: {\"questions\":[{\"question\":string,\"choices\":[string,string,string,string],\"answerIndex\":number,\"explanation\":string,\"difficulty\":\"Easy\"|\"Medium\"|\"Advanced\"}]}",
        `Create exactly ${count} questions at ${difficulty} difficulty. For Mixed, distribute difficulty across Easy, Medium, and Advanced.`,
        "Use four plausible answer choices and exactly one correct answer. answerIndex is zero-based. Keep explanations grounded in the source.",
      ].join("\n"),
      input: `Course: ${courseTitle}\n\nSOURCE TEXT:\n${body.sourceText.trim()}`,
      maxOutputTokens: 2200,
    });

    const jsonText = result.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error("AI_EMPTY_RESPONSE");
    const parsed = JSON.parse(jsonText) as { questions?: QuizQuestion[] };
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) throw new Error("AI_EMPTY_RESPONSE");

    const questions = parsed.questions.slice(0, count).map((item) => {
      if (
        typeof item.question !== "string" ||
        !Array.isArray(item.choices) ||
        item.choices.length !== 4 ||
        !Number.isInteger(item.answerIndex) ||
        item.answerIndex < 0 ||
        item.answerIndex > 3 ||
        typeof item.explanation !== "string"
      ) {
        throw new Error("AI_EMPTY_RESPONSE");
      }
      return {
        question: item.question,
        choices: item.choices.map(String),
        answerIndex: item.answerIndex,
        explanation: item.explanation,
        difficulty: item.difficulty || difficulty,
      };
    });

    return Response.json({ questions });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === "AI_EMPTY_RESPONSE")) {
      return Response.json({ error: "The AI returned an invalid quiz. Please regenerate it." }, { status: 502 });
    }
    return aiErrorResponse(error);
  }
}
