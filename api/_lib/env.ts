export function readCleanEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== 'string') return undefined;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value.length > 0 ? value : undefined;
}

export function getGeminiApiKey(): string | undefined {
  const primary = readCleanEnv('GEMINI_API_KEY');
  if (primary && primary !== 'MY_GEMINI_API_KEY') {
    return primary;
  }
  const fallback = readCleanEnv('GOOGLE_API_KEY');
  if (fallback && fallback !== 'MY_GEMINI_API_KEY') {
    return fallback;
  }
  return undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiModelOverride(): string | undefined {
  return readCleanEnv('GEMINI_MODEL');
}
