"use client";

import { parseCv } from "./cv-document";

// Builds a real PDF file in the browser (no print dialog, so no browser header with the page's URL
// or date). Text stays selectable, which applicant tracking systems need. The library and fonts
// load only when someone downloads.

let fontsReady = false;

export async function downloadPdf(
  fileName: string,
  kind: "cv" | "letter",
  text: string,
  sender: { name: string; contact: string },
) {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

  if (!fontsReady) {
    Font.register({
      family: "Source Sans 3",
      fonts: [
        { src: "/fonts/SourceSans3-Regular.ttf" },
        { src: "/fonts/SourceSans3-Semibold.ttf", fontWeight: 600 },
        { src: "/fonts/SourceSans3-It.ttf", fontStyle: "italic" },
      ],
    });
    // Keep words whole; the default splits long words with hyphens.
    Font.registerHyphenationCallback((word) => [word]);
    fontsReady = true;
  }

  const s = StyleSheet.create({
    page: { fontFamily: "Source Sans 3", fontSize: 10.5, lineHeight: 1.4, color: "#1f2933", paddingTop: 44, paddingBottom: 44, paddingHorizontal: 50 },
    name: { fontSize: 21, fontWeight: 600, color: "#2f4556", lineHeight: 1.15 },
    sub: { color: "#4f6f5d", marginTop: 2 },
    contact: { color: "#5b6b78", fontSize: 9.5, marginTop: 2 },
    // No letter-spacing: text readers would see "P R O F I L E".
    section: { fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", color: "#2f4556", borderBottomWidth: 0.75, borderBottomColor: "#bcd3e3", paddingBottom: 2, marginTop: 12, marginBottom: 4 },
    role: { fontWeight: 600, marginTop: 7 },
    meta: { color: "#5b6b78", fontSize: 9.5 },
    para: { marginTop: 2 },
    bulletRow: { flexDirection: "row", marginTop: 1.5 },
    bulletDot: { width: 10 },
    bulletText: { flex: 1 },
    letterHead: { marginBottom: 22 },
    letterPara: { marginBottom: 9 },
  });

  // The font joins f+i, f+t and similar into one shape, and some text readers then drop a letter
  // ("shift" read as "shif"). An invisible zero-width non-joiner keeps the letters separate.
  const t = (v: string) => v.replace(/f(?=[fijlt])/g, "f\u200C");

  let body;
  if (kind === "cv") {
    const blocks = parseCv(text);
    let afterName = 0;
    body = blocks.map((b, i) => {
      if (b.kind === "name") afterName = 2;
      else if (afterName) afterName--;
      switch (b.kind) {
        case "name":
          return <Text key={i} style={s.name}>{t(b.text)}</Text>;
        case "line":
          return (
            <Text key={i} style={afterName ? (i === 1 ? s.sub : s.contact) : s.para}>
              {t(b.text)}
            </Text>
          );
        case "section":
          // Never leave a heading alone at the bottom of a page.
          return <Text key={i} style={s.section} minPresenceAhead={36}>{t(b.text)}</Text>;
        case "role":
          return <Text key={i} style={s.role} minPresenceAhead={30}>{t(b.text)}</Text>;
        case "meta":
          return <Text key={i} style={s.meta} minPresenceAhead={14}>{t(b.text)}</Text>;
        case "bullets":
          return (
            <View key={i}>
              {b.items.map((it, j) => (
                <View key={j} style={s.bulletRow} wrap={false}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{t(it)}</Text>
                </View>
              ))}
            </View>
          );
      }
    });
  } else {
    body = (
      <>
        <View style={s.letterHead}>
          {sender.name && <Text style={s.name}>{t(sender.name)}</Text>}
          {sender.contact && <Text style={s.contact}>{t(sender.contact)}</Text>}
        </View>
        {text
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p, i) => (
            <Text key={i} style={s.letterPara}>
              {t(p)}
            </Text>
          ))}
      </>
    );
  }

  const blob = await pdf(
    <Document title={fileName} author={sender.name} creator="AI Job Search" producer="AI Job Search">
      <Page size="LETTER" style={s.page}>
        {body}
      </Page>
    </Document>,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
