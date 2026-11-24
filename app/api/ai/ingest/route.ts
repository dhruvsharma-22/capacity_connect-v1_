import { PDFParse } from "pdf-parse";
import { aiErrorResponse, createEmbedding } from "@/lib/ai/openai";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function chunkText(text: string, size = 1100, overlap = 140) {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += size - overlap) {
    const chunk = text.slice(start, start + size).trim();
    if (chunk.length >= 80) chunks.push(chunk);
  }
  return chunks.slice(0, 120);
}

export async function POST(request: Request) {
  let parser: PDFParse | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const courseId = form.get("courseId");
    if (!(file instanceof File) || file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Choose a PDF course resource." }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return Response.json({ error: "PDFs must be 12 MB or smaller." }, { status: 413 });
    }

    let rawText = "";
    let pageCount = 0;
    try {
      parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
      const parsed = await parser.getText();
      rawText = parsed.text;
      pageCount = parsed.total;
    } catch (error) {
      console.error("PDF text extraction failed", error);
      return Response.json({ error: "Could not extract text from this PDF. Check that it is readable and not password protected." }, { status: 422 });
    }
    const text = rawText.replace(/\s+/g, " ").trim();
    if (text.length < 80) {
      return Response.json({ error: "No usable text was found. This PDF may be scanned; OCR is not enabled." }, { status: 422 });
    }

    const chunks = chunkText(text);
    const supabase = getSupabaseAdmin();
    let indexed = false;
    let resourceId: string | null = null;

    if (supabase && typeof courseId === "string" && courseId) {
      const storagePath = `${courseId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage.from("course-materials").upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploadError) throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);

      const { data: resource, error: resourceError } = await supabase
        .from("course_resources")
        .insert({ course_id: courseId, title: file.name, storage_path: storagePath, mime_type: file.type })
        .select("id")
        .single();
      if (resourceError || !resource) throw new Error(`Saving course resource failed: ${resourceError?.message || "unknown error"}`);
      resourceId = resource.id;

      const rows = [];
      for (let i = 0; i < chunks.length; i += 32) {
        const batch = chunks.slice(i, i + 32);
        const embeddings = await Promise.all(batch.map(createEmbedding));
        rows.push(...batch.map((content, offset) => ({
          resource_id: resourceId,
          course_id: courseId,
          chunk_index: i + offset,
          content,
          embedding: embeddings[offset],
        })));
      }
      const { error: chunksError } = await supabase.from("document_chunks").insert(rows);
      if (chunksError) throw new Error(`Saving document vectors failed: ${chunksError.message}`);
      indexed = true;
    }

    return Response.json({ text: text.slice(0, 14_000), pages: pageCount, chunks: chunks.length, indexed, resourceId });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Supabase")) {
      console.error(error.message);
      return Response.json({ error: "The PDF was read, but saving it to Supabase failed. Check the Supabase setup." }, { status: 502 });
    }
    return aiErrorResponse(error);
  } finally {
    await parser?.destroy().catch(() => undefined);
  }
}
