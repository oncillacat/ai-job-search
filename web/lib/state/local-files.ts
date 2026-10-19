"use client";

// The person's files, kept in this browser's private storage (the Origin Private File System).
// Nothing here is sent to a server. Layout:
//   uploads/<file>                    CV and optional documents, as uploaded
//   profile.json                      the profile Claude read from the CV
//   generated/<job-id>/<file>.txt     form answers, follow-up emails

export interface StoredFile {
  path: string;
  size: number;
  modified: number;
}

const listeners = new Set<() => void>();
export function onFilesChanged(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const changed = () => listeners.forEach((l) => l());

export function filesSupported() {
  return typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";
}

const clean = (part: string) => part.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120) || "file";

async function folder(parts: string[], create: boolean) {
  let dir = await navigator.storage.getDirectory();
  for (const p of parts) dir = await dir.getDirectoryHandle(clean(p), { create });
  return dir;
}

/** Saves a file at a path like "uploads/cv.pdf". Quietly does nothing where unsupported. */
export async function saveFile(path: string, data: Blob | string) {
  if (!filesSupported()) return;
  try {
    const parts = path.split("/");
    const name = clean(parts.pop()!);
    const dir = await folder(parts, true);
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
    // Ask the browser not to clear this storage under pressure; it may decline.
    await navigator.storage.persist?.().catch(() => false);
    changed();
  } catch {
    // Private windows and some browsers refuse; the demo keeps working without saved files.
  }
}

export async function readFile(path: string): Promise<File | null> {
  if (!filesSupported()) return null;
  try {
    const parts = path.split("/");
    const name = clean(parts.pop()!);
    const dir = await folder(parts, false);
    return await (await dir.getFileHandle(name)).getFile();
  } catch {
    return null;
  }
}

export async function listFiles(): Promise<StoredFile[]> {
  if (!filesSupported()) return [];
  const out: StoredFile[] = [];
  async function walk(dir: FileSystemDirectoryHandle, prefix: string) {
    // @ts-expect-error -- entries() is in all browsers that support OPFS, not yet in TS's DOM lib.
    for await (const [name, handle] of dir.entries() as AsyncIterable<[string, FileSystemHandle]>) {
      if (handle.kind === "directory") await walk(handle as FileSystemDirectoryHandle, `${prefix}${name}/`);
      else {
        const f = await (handle as FileSystemFileHandle).getFile();
        out.push({ path: `${prefix}${name}`, size: f.size, modified: f.lastModified });
      }
    }
  }
  try {
    await walk(await navigator.storage.getDirectory(), "");
  } catch {
    return [];
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export async function deleteFile(path: string) {
  if (!filesSupported()) return;
  try {
    const parts = path.split("/");
    const name = parts.pop()!;
    const dir = await folder(parts, false);
    await dir.removeEntry(name);
    changed();
  } catch {
    // Already gone.
  }
}

export async function deleteAllFiles() {
  if (!filesSupported()) return;
  try {
    const root = await navigator.storage.getDirectory();
    // @ts-expect-error -- keys() is supported wherever OPFS is.
    for await (const name of root.keys() as AsyncIterable<string>) await root.removeEntry(name, { recursive: true });
    changed();
  } catch {
    // Nothing stored.
  }
}
