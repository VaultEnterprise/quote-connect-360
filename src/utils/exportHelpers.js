/**
 * Export utilities for CSV and JSON data export across app
 */

export function exportToCSV(data, filename = "export.csv", columns = null) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]);

  // Build CSV content
  const headers = cols.join(",");
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const val = row[col];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? "";
      })
      .join(",")
  );

  const csv = [headers, ...rows].join("\n");
  downloadFile(csv, filename, "text/csv");
}

export function exportToJSON(data, filename = "export.json") {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, "application/json");
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(baseName, extension = "csv") {
  const now = new Date().toISOString().slice(0, 10);
  return `${baseName}_${now}.${extension}`;
}