import { z } from "zod";

// What Gemini returns. Ids are assigned on the server, not by the model.
export const ModelMedicineSchema = z.object({
  name: z.string(),
  dose_as_written: z.string().nullable(),
  frequency_as_written: z.string().nullable(),
  instructions_as_written: z.string().nullable(),
  duration_as_written: z.string().nullable(),
  source_text: z.string(),
  unsure: z.boolean(),
});

export const ModelExtractionSchema = z.object({
  document_ok: z.boolean(),
  problem: z.enum(["blurry", "not_document", "no_medicines"]).nullable(),
  medicines: z.array(ModelMedicineSchema),
  warning_signs: z.array(z.string()),
  follow_up: z.string().nullable(),
});

export type ModelExtraction = z.infer<typeof ModelExtractionSchema>;

// JSON Schema sent to Gemini as responseJsonSchema.
// Gemini doesn't accept the "$schema" keyword, so it is dropped.
const { $schema: _drop, ...extractionJson } = z.toJSONSchema(ModelExtractionSchema, { target: "draft-7" });
export const extractionJsonSchema = extractionJson;

export const TeluguRequestSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1).max(40), text: z.string().min(1).max(600) })).max(60),
});

export const TeluguReplySchema = z.object({
  items: z.array(z.object({ id: z.string(), te: z.string() })),
});

const { $schema: _dropT, ...teluguJson } = z.toJSONSchema(TeluguReplySchema, { target: "draft-7" });
export const teluguJsonSchema = teluguJson;
