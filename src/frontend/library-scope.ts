/**
 * Scopes localStorage preference keys to the currently opened library, so each
 * library keeps its own UI preferences. The legacy default library (userData)
 * uses unsuffixed keys so preferences of existing users are preserved.
 */

let librarySuffix = '';
let libraryDisplayName: string | null = null;

/** djb2 string hash, hex-encoded. Stable across sessions for the same path. */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function setLibraryScope(
  libraryPath: string,
  isDefaultLibrary: boolean,
  name?: string,
): void {
  librarySuffix = isDefaultLibrary ? '' : `-lib-${hashString(libraryPath)}`;
  libraryDisplayName = isDefaultLibrary ? null : name ?? null;
}

export function scopedStorageKey(key: string): string {
  return key + librarySuffix;
}

/** Name of the opened library for display purposes (null for the default library). */
export function getLibraryDisplayName(): string | null {
  return libraryDisplayName;
}
