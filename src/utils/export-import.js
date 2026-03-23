/**
 * Export Utility
 * CSV/JSON export for any list of records
 */
export function exportToCSV(data, filename, columns = null) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]);
  const headers = cols.join(",");
  
  const rows = data.map(row =>
    cols.map(col => {
      const val = row[col];
      const escaped = typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val ?? "";
      return escaped;
    }).join(",")
  );

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, filename || "export.csv");
}

export function exportToJSON(data, filename) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadFile(blob, filename || "export.json");
}

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Parse CSV file and return array of objects
 */
export async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
        const rows = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = values[i]?.trim().replace(/^"|"$/g, "") || "";
          });
          return obj;
        });
        resolve(rows.filter(r => Object.values(r).some(v => v))); // Filter empty rows
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}