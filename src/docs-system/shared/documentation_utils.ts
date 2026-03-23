// Utility functions for documentation system

export function sanitizeCodeString(input: string): string {
  return input.replace(/[^A-Za-z0-9_]/g, "_");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, maxKeywords);

  return [...new Set(words)];
}

export function plaintext(markdown: string): string {
  return markdown
    .replace(/[#*`>_-]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function chunkText(text: string, maxChunkSize: number = 2000): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}