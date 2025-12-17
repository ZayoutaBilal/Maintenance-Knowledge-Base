// import OpenAI from "openai";

// let openai: OpenAI | null = null;

// function getOpenAIClient(): OpenAI {
//   if (!process.env.OPENAI_API_KEY) {
//     throw new Error("OpenAI API key is not configured");
//   }
//   if (!openai) {
//     openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//   }
//   return openai;
// }

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${process.env.FASTAPI_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  console.log(data)
  return data.embedding;
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
