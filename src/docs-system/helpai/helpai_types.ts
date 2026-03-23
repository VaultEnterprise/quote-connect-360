export interface HelpAiChunk {
  chunk_id: string;
  doc_type: "page" | "feature" | "control" | "workflow" | "troubleshooting" | "overview";
  source_code: string;
  title: string;
  route?: string;
  roles: string[];
  keywords: string[];
  body_markdown: string;
  body_plaintext: string;
  dependencies: string[];
  related_codes: string[];
  embedding_text: string;
}

export interface HelpAiIngestionPayload {
  application_name: string;
  version: string;
  generated_on: string;
  chunks: HelpAiChunk[];
}