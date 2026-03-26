import { base44 } from "@/api/base44Client";

export async function inspectCensusFile(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  const response = await base44.functions.invoke("importCensusFile", {
    mode: "inspect",
    fileUrl: file_url,
    fileName: file.name,
  });
  return { fileUrl: file_url, ...response.data };
}

export async function runCensusImport(request) {
  const response = await base44.functions.invoke("importCensusFile", request);
  return response.data;
}