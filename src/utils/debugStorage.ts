export type DebugStorageScope = {
  mode?: string | null;
};

function buildCandidateKeys(baseKey: string, scope?: DebugStorageScope): string[] {
  const mode = scope?.mode ? String(scope.mode) : '';
  if (mode) return [`${baseKey}_${mode}`, baseKey];
  return [baseKey];
}

export function readDebugRaw(
  baseKey: string,
  scope?: DebugStorageScope
): { raw: string | null; key: string | null } {
  if (typeof localStorage === 'undefined') return { raw: null, key: null };

  const keys = buildCandidateKeys(baseKey, scope);
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return { raw, key };
    } catch {
      // ignore
    }
  }

  return { raw: null, key: null };
}

export function readDebugJSON<T>(
  baseKey: string,
  scope?: DebugStorageScope
): { value: T | null; key: string | null } {
  const { raw, key } = readDebugRaw(baseKey, scope);
  if (!raw) return { value: null, key: null };

  try {
    return { value: JSON.parse(raw) as T, key };
  } catch {
    return { value: null, key: null };
  }
}

export function writeDebugJSON(
  baseKey: string,
  value: unknown,
  scope?: DebugStorageScope,
  options?: { writeLegacy?: boolean }
): void {
  if (typeof localStorage === 'undefined') return;

  const mode = scope?.mode ? String(scope.mode) : '';
  const writeLegacy = options?.writeLegacy !== false;

  try {
    const raw = JSON.stringify(value);
    if (mode) localStorage.setItem(`${baseKey}_${mode}`, raw);
    if (writeLegacy) localStorage.setItem(baseKey, raw);
  } catch {
    // localStorage failures are non-fatal
  }
}
