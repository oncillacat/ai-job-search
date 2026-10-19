import { ButtonLink, Card } from "@/components/ui";

const worries = [
  {
    worry: "“What if I'm missing the right job?”",
    answer:
      "Every morning at 9:00, you get only the strong matches. We tell you how many postings we read, where from, and how many medium and low matches we set aside, so you can stop checking.",
  },
  {
    worry: "“Should I even apply to this one?”",
    answer:
      "Each job gets a plain verdict, Go, Maybe or Let it go, with two or three reasons. You decide; we just make the decision lighter.",
  },
  {
    worry: "“My CV still isn't right for this posting.”",
    answer:
      "Your master CV stays yours. For each job you see exactly what changed, and a Ready to send check tells you when it's done.",
  },
];

const steps = [
  { title: "Upload your CV once", body: "We turn it into a profile you can read and correct." },
  { title: "Read your 9 a.m. list", body: "Only strong Canadian matches, with reasons. Nothing more." },
  { title: "Tailor, check, send", body: "A tailored CV and cover letter, honest about any gaps." },
];

const container = "mx-auto w-full max-w-4xl px-4 sm:px-6";

export default function Home() {
  return (
    <div>
      <section>
        <div className={`${container} settle pb-20 pt-12 sm:pb-28 sm:pt-20`}>
          <p className="mb-4 text-sm tracking-wide text-mist-ink">A calmer job search, for Canada</p>
          <h1 className="max-w-2xl text-balance font-display text-4xl leading-[1.15] sm:text-5xl">
            Fewer tabs. Fewer rewrites. Nothing important missed.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-mist-ink">
            Applying for jobs asks for a lot of attention. AI Job Search reads the postings, tells
            you which few are worth your time, and helps you send a CV you can stop editing.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/start">Start with your CV</ButtonLink>
            <ButtonLink href="/digest" variant="quiet" className="!bg-surface hover:!bg-surface/80">
              See a sample morning
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className={`${container} pb-20`}>
        <section aria-labelledby="worries" className="-mt-10 pb-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {worries.map((w) => (
              <Card key={w.worry} className="!p-6 shadow-[0_1px_2px_rgba(31,42,51,0.04)]">
                <p className="font-display text-lg leading-snug">{w.worry}</p>
                <p className="mt-3 text-muted">{w.answer}</p>
              </Card>
            ))}
          </div>
          <h2 id="worries" className="sr-only">
            Made for the worries that keep you refreshing
          </h2>
        </section>

        <section aria-labelledby="how" className="py-10">
          <h2 id="how" className="mb-8 font-display text-2xl">
            How it works
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-mist font-display text-mist-ink">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="story" className="py-10">
          <div className="grid gap-8 sm:grid-cols-[180px_1fr]">
            <div>
              <p className="text-sm tracking-wide text-muted">Our story</p>
              <h2 id="story" className="mt-2 text-balance font-display text-2xl leading-snug">
                Built by someone who was tired of rewriting.
              </h2>
            </div>
            <div className="max-w-prose space-y-4 text-[17px]">
              <p>
                This started with one job search. Every posting meant the same evening ritual: open the
                CV, rewrite the summary, reorder the bullet points, swap in the posting&apos;s keywords,
                second-guess every word, export, and do it all again for the next one.
              </p>
              <p>
                The hardest part wasn&apos;t the work. It was never knowing when a version was good
                enough, and the quiet fear that the right job was sitting in a tab that hadn&apos;t been
                opened yet. Job sites only made it louder, with more alerts, more listings and more
                &ldquo;apply now&rdquo;.
              </p>
              <p>
                What was missing was something that would do the reading, say plainly which few jobs
                were worth the effort, tailor the CV honestly from facts already written once, and then
                say: <em className="font-display">this is ready, you can send it.</em> So we built it, for
                anyone who feels the same way.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10">
          <Card tint="mist" className="text-center">
            <p className="mx-auto max-w-lg font-display text-2xl leading-snug">
              “Good enough, sent, is better than perfect, still open in a tab.”
            </p>
            <p className="mt-3 text-muted">The idea this tool is built around.</p>
          </Card>
        </section>

        <section aria-labelledby="open-source" className="py-10">
          <Card className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 id="open-source" className="font-display text-2xl">
                Open source, and free to use
              </h2>
              <p className="mt-3 max-w-prose text-muted">
                This project is based on{" "}
                <a
                  href="https://github.com/MadsLorentzen/ai-job-search"
                  rel="noopener noreferrer"
                  className="font-medium text-sage underline underline-offset-4 hover:no-underline"
                >
                  MadsLorentzen/ai-job-search
                </a>
                , an open-source job application framework released under the MIT licence. Its fit
                evaluation, CV tailoring and interview prep are what this site is built on.
                Please feel free to use it, copy it, and adapt it for your own search.
              </p>
            </div>
            <a
              href="https://github.com/MadsLorentzen/ai-job-search"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-surface-2 px-5 py-2.5 text-[15px] font-medium text-ink transition-colors duration-300 hover:bg-line"
            >
              View on GitHub →
            </a>
          </Card>
        </section>
      </div>
    </div>
  );
}
