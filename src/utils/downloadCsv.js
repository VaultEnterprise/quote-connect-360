export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((value) => JSON.stringify(value ?? "")).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}