export function isMissingConvexFunction(error: unknown): boolean {
  const text = collectErrorText(error);
  return /could not find (?:public )?function/i.test(text);
}

function collectErrorText(error: unknown): string {
  const chunks: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current != null; depth += 1) {
    if (typeof current === "string") {
      chunks.push(current);
      break;
    }
    if (current instanceof Error) {
      chunks.push(current.message);
      current = current.cause;
      continue;
    }
    if (typeof current === "object") {
      const record = current as {
        message?: unknown;
        data?: unknown;
        cause?: unknown;
      };
      if (typeof record.message === "string") {
        chunks.push(record.message);
      }
      if (typeof record.data === "string") {
        chunks.push(record.data);
      }
      current = record.cause;
      continue;
    }
    chunks.push(String(current));
    break;
  }
  return chunks.join("\n");
}
