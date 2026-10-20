import type { Metadata } from "next";
import { liveAvailable } from "@/lib/live";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Job Search",
  description:
    "A calm job search for Canada. A short morning list, a CV that's ready when it's ready, and nothing missed.",
};

// Applies the saved theme before first paint so there's no flash.
const themeScript = `try{var t=localStorage.getItem("ajs-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div
          role="note"
          className="bg-sand px-4 py-2 text-center text-[14px] leading-snug text-sand-ink"
        >
          {liveAvailable() ? (
            <>
              <strong className="font-semibold">Preview.</strong> Real job searches with Claude. Nothing is ever
              submitted for you, and your CV and documents stay in your browser.
            </>
          ) : (
            <>
              <strong className="font-semibold">Sample demo.</strong> The jobs, people and companies here are made up,
              and anything you enter stays in your browser. With an access code, or in the Mac app, it searches real
              jobs.
            </>
          )}
        </div>
        {children}
      </body>
    </html>
  );
}
