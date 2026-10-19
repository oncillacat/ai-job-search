"use client";

import { useEffect, useState } from "react";
import {
  deleteAllFiles,
  deleteFile,
  filesSupported,
  listFiles,
  onFilesChanged,
  readFile,
  type StoredFile,
} from "@/lib/state/local-files";
import { Button } from "./ui";

const groups: { prefix: string; label: string }[] = [
  { prefix: "uploads/", label: "What you uploaded" },
  { prefix: "profile.json", label: "What Claude read from your CV" },
  { prefix: "generated/", label: "What was written for you" },
];

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function download(path: string) {
  const file = await readFile(path);
  if (!file) return;
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = path.split("/").slice(-2).join("-").replace(/^uploads-/, "");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lists the files kept in this browser's private storage, with download and delete. */
export function YourFiles() {
  const [files, setFiles] = useState<StoredFile[] | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      void listFiles().then((f) => {
        if (active) setFiles(f);
      });
    load();
    const off = onFilesChanged(load);
    return () => {
      active = false;
      off();
    };
  }, []);

  if (files === null) return <p className="text-[15px] text-muted">Looking for your files…</p>;
  if (!filesSupported())
    return <p className="text-[15px] text-muted">This browser can&apos;t keep files, so nothing is stored.</p>;
  if (files.length === 0)
    return (
      <p className="text-[15px] text-muted">
        No files yet. Your CV, what Claude reads from it, and the drafts written for you will appear here.
      </p>
    );

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const inGroup = files.filter((f) => f.path.startsWith(g.prefix));
        if (!inGroup.length) return null;
        return (
          <div key={g.prefix}>
            <h3 className="mb-2 font-medium">{g.label}</h3>
            <ul className="divide-y divide-line border border-line">
              {inGroup.map((f) => (
                <li key={f.path} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 break-all text-[15px]">
                    {f.path.replace(/^uploads\//, "").replace(/^generated\//, "")}
                    <span className="ml-2 text-muted">{size(f.size)}</span>
                  </span>
                  <span className="flex gap-2">
                    <Button variant="ghost" className="!px-3 !py-1" onClick={() => void download(f.path)}>
                      Download
                    </Button>
                    <Button variant="ghost" className="!px-3 !py-1" onClick={() => void deleteFile(f.path)}>
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <Button variant="quiet" onClick={() => void deleteAllFiles()}>
        Delete all files
      </Button>
    </div>
  );
}
