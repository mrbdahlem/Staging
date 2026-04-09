type LogLevel = "info" | "error";

export type LogContext = Record<string, unknown>;

export function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    context,
    level,
    message,
    timestamp: new Date().toISOString()
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  console.log(serialized);
}
