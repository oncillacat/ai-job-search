"use client";

// Turns the tailored CV text (a light Markdown outline: # name, ## section, ### role, - bullet)
// into a formatted document, on screen and as a printable page the person saves as PDF.

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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const printStyles = `
  @page { size: letter; margin: 16mm 16mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Source Sans 3", "Helvetica Neue", Arial, sans-serif; color: #1f2933; font-size: 10.5pt; line-height: 1.42; margin: 0; }
  h1 { font-size: 20pt; margin: 0; color: #2f4556; font-weight: 600; }
  .sub { color: #4f6f5d; margin: 2pt 0 0; }
  h2 { font-size: 9pt; letter-spacing: .08em; text-transform: uppercase; color: #2f4556; border-bottom: 1px solid #bcd3e3; padding-bottom: 2pt; margin: 13pt 0 5pt; }
  .role { font-weight: 600; margin: 8pt 0 0; break-after: avoid; }
  .meta { color: #5b6b78; font-size: 9.5pt; margin: 0; break-after: avoid; }
  ul { margin: 3pt 0 0; padding-left: 14pt; }
  li { margin: 1.5pt 0; }
  p { margin: 3pt 0; }
  .letter p { margin: 0 0 9pt; white-space: pre-wrap; }
`;

function cvHtml(text: string) {
  const blocks = parseCv(text);
  return blocks
    .map((b, i) => {
      switch (b.kind) {
        case "name":
          return `<h1>${esc(b.text)}</h1>`;
        case "line":
          return blocks[i - 1]?.kind === "name" || blocks[i - 2]?.kind === "name"
            ? `<p class="sub">${esc(b.text)}</p>`
            : `<p>${esc(b.text)}</p>`;
        case "section":
          return `<h2>${esc(b.text)}</h2>`;
        case "role":
          return `<p class="role">${esc(b.text)}</p>`;
        case "meta":
          return `<p class="meta">${esc(b.text)}</p>`;
        case "bullets":
          return `<ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
      }
    })
    .join("\n");
}

/** Opens a clean print view; the person chooses "Save as PDF" in the print dialog. */
export function printDocument(title: string, kind: "cv" | "letter", text: string, lang: string) {
  const body =
    kind === "cv"
      ? cvHtml(text)
      : `<div class="letter">${text
          .split(/\n{2,}/)
          .map((p) => `<p>${esc(p.trim())}</p>`)
          .join("")}</div>`;
  // A hidden frame in this page, so no pop-up blocker gets in the way.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const w = frame.contentWindow;
  if (!doc || !w) {
    frame.remove();
    return false;
  }
  doc.open();
  doc.write(
    `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><title>${esc(title)}</title>` +
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&display=swap">` +
      `<style>${printStyles}</style></head><body>${body}</body></html>`,
  );
  doc.close();
  // The saved PDF is named after the page title, so borrow it while the dialog is open.
  const pageTitle = document.title;
  setTimeout(() => {
    document.title = title;
    w.focus();
    w.print();
    setTimeout(() => {
      document.title = pageTitle;
      frame.remove();
    }, 1000);
  }, 600);
  return true;
}

/** Plain text for pasting into a form: the outline markers removed. */
export function plainText(text: string) {
  return text
    .split("\n")
    .map((l) => l.replace(/^#{1,6}\s+/, "").replace(/^[-*]\s+/, "• "))
    .join("\n");
}
