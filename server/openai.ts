import OpenAI from "openai";

let openai: OpenAI | null = null;

function getHFClient(): OpenAI {
  if (!process.env.HF_TOKEN) {
    throw new Error("Hugging Face API key is not configured");
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.HF_TOKEN,
      baseURL: "https://router.huggingface.co/v1", // HF OpenAI-compatible endpoint
    });
  }
  return openai;
}

import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.HF_TOKEN) {
    throw new Error("Hugging Face API key is not configured");
  }

  // These models are known to work with Hugging Face Inference API
  const workingModels = [
    "sentence-transformers/paraphrase-MiniLM-L6-v2",  // Alternative version
    "sentence-transformers/all-mpnet-base-v2",        // Another reliable one
    "BAAI/bge-base-en-v1.5",                          // Better performance
    "thenlper/gte-base",                              // General purpose
    "intfloat/e5-base-v2",                            // Efficient
    "facebook/bart-base"                              // Fallback
  ];

  for (const model of workingModels) {
    try {
      console.log(`Trying model: ${model}`);
      const result = await hf.featureExtraction({
        model,
        inputs: text,
      });
      console.log(`Success with model: ${model}`);
      return result as number[];
    } catch (error: any) {
      console.log(`Model ${model} failed: ${error.message}`);
    }
  }

  throw new Error("All embedding models failed. Please check your HF_TOKEN or try a different model.");
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function semanticSearch(
    query: string,
    problems: Array<{ id: string; problem: string; solution: string; embedding: number[] | null }>
): Promise<Array<{ id: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(query);

  return problems
      .filter(p => p.embedding && Array.isArray(p.embedding))
      .map(p => ({
        id: p.id,
        similarity: cosineSimilarity(queryEmbedding, p.embedding as number[]),
      }))
      .sort((a, b) => b.similarity - a.similarity);
}
