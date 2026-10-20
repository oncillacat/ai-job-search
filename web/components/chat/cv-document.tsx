"use client";

// Turns the tailored CV text (a light Markdown outline: # name, ## section, ### role, - bullet)
// into a formatted document on screen. pdf-export.tsx turns the same outline into a PDF file.

type Block =
  | { kind: "name"; text: string }
  | { kind: "line"; text: string }
  | { kind: "section"; text: string }
  | { kind: "role"; text: string }
  | { kind: "meta"; text: string }
  | { kind: "bullets"; items: string[] };

export function parseCv(text: string): Block[] {
  const blocks: Block[] = [];
  let afterRole = false;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "bullets") last.items.push(bullet[1]);
      else blocks.push({ kind: "bullets", items: [bullet[1]] });
      afterRole = false;
    } else if (line.startsWith("### ")) {
      blocks.push({ kind: "role", text: line.slice(4) });
      afterRole = true;
      continue;
    } else if (line.startsWith("## ")) {
      blocks.push({ kind: "section", text: line.slice(3) });
    } else if (line.startsWith("# ")) {
      blocks.push({ kind: "name", text: line.slice(2) });
    } else {
      // The line right under a role is its place and dates.
      blocks.push({ kind: afterRole ? "meta" : "line", text: line.replace(/^#+\s*/, "") });
    }
    afterRole = false;
  }
  return blocks;
}

/** The CV as it would look on paper. */
export function CvPreview({ text }: { text: string }) {
  const blocks = parseCv(text);
  return (
    <div className="border border-line bg-white px-6 py-7 text-[13.5px] leading-relaxed text-[#1f2933] sm:px-10">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "name":
            return (
              <h3 key={i} className="text-[24px] font-semibold leading-tight text-[#2f4556]">
                {b.text}
              </h3>
            );
          case "line":
            return (
              <p key={i} className={blocks[i - 1]?.kind === "name" || blocks[i - 2]?.kind === "name" ? "text-[#4f6f5d]" : "mt-1"}>
                {b.text}
              </p>
            );
          case "section":
            return (
              <h4
                key={i}
                className="mt-5 border-b border-[#bcd3e3] pb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2f4556]"
              >
                {b.text}
              </h4>
            );
          case "role":
            return (
              <p key={i} className="mt-3 font-semibold">
                {b.text}
              </p>
            );
          case "meta":
            return (
              <p key={i} className="text-[12.5px] text-[#5b6b78]">
                {b.text}
              </p>
            );
          case "bullets":
            return (
              <ul key={i} className="mt-1 list-disc space-y-0.5 pl-5">
                {b.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}

/** Plain text for pasting into a form: the outline markers removed. */
export function plainText(text: string) {
  return text
    .split("\n")
    .map((l) => l.replace(/^#{1,6}\s+/, "").replace(/^[-*]\s+/, "• "))
    .join("\n");
}
