type ResponsesRequest = {
  instructions: string;
  input: string | Array<{ role: "user" | "assistant"; content: string }>;
  maxOutputTokens?: number;
};

export class AIConfigurationError extends Error {}

export async function createEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIConfigurationError("AI_NOT_CONFIGURED");
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small", input }),
    signal: AbortSignal.timeout(30_000),
  });
  const result = (await response.json().catch(() => null)) as
    | { data?: Array<{ embedding?: number[] }>; error?: { message?: string } }
    | null;
  if (!response.ok || !result?.data?.[0]?.embedding) {
    console.error("OpenAI embeddings error", response.status, result?.error?.message);
    throw new Error(response.status === 401 ? "AI_KEY_INVALID" : "AI_REQUEST_FAILED");
  }
  return result.data[0].embedding;
}

export async function createAIResponse({
  instructions,
  input,
  maxOutputTokens = 900,
}: ResponsesRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIConfigurationError("AI_NOT_CONFIGURED");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-6.2-astra",
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const result = (await response.json().catch(() => null)) as
    | { output_text?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    console.error("OpenAI Responses API error", response.status, result?.error?.message);
    throw new Error(response.status === 401 ? "AI_KEY_INVALID" : "AI_REQUEST_FAILED");
  }

  const text = result?.output_text?.trim();
  if (!text) throw new Error("AI_EMPTY_RESPONSE");
  return text;
}

export function aiErrorResponse(error: unknown): Response {
  if (error instanceof AIConfigurationError) {
    return Response.json(
      { error: "AI is not configured yet. Add OPENAI_API_KEY to .env.local and restart the dev server." },
      { status: 503 },
    );
  }

  if (error instanceof Error && error.message === "AI_KEY_INVALID") {
    return Response.json({ error: "The OpenAI API key was rejected. Check OPENAI_API_KEY." }, { status: 401 });
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    return Response.json({ error: "The AI request timed out. Please try again." }, { status: 504 });
  }

  console.error("AI request failed", error);
  return Response.json({ error: "The AI request failed. Please try again." }, { status: 502 });
}
