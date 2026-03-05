import { normalizeDisplayValue } from './displayMappings';

export function extractTestRows(raw) {
  const rows = [];

  for (const [key, value] of Object.entries(raw)) {
    // Skip summary/meta nodes like "info" and any non-object values.
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    if (key.toLowerCase() === "info") continue;

    rows.push({
      testName: key,                                   // key of the JSON
      group: normalizeDisplayValue('group', String(value.group ?? "")),
      type: normalizeDisplayValue('type', String(value.typeName ?? value.type ?? "")), // prefer `typeName` if present, else `type`
      status: normalizeDisplayValue('status', String(value.status ?? "")),
      errorType: normalizeDisplayValue('errorType', String(value.errorType ?? "")),
    });
  }

  return rows;
}
