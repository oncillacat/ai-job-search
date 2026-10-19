// Shapes shared by the UI and (later) the Supabase backend.
// Field names mirror the deferred data model in the plan.

export type Verdict = "go" | "maybe" | "let-go";
export type GateStatus = "pass" | "flag" | "unverified" | "fail";
export type Workplace = "Hybrid" | "Remote" | "On-site";

export interface Experience {
  id: string;
  title: string;
  org: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  start: string;
  end: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Profile {
  name: string;
  headline: string;
  email: string;
  location: string;
  workAuthorization: string;
  languages: Language[];
  targetRoles: string[];
  targetCities: string[];
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workplace: Workplace;
  salary?: string;
  source: "Job Bank Canada" | "LinkedIn (link you pasted)";
  postedDaysAgo: number;
  closesInDays?: number;
  about: string;
  requirements: string[];
  niceToHave: string[];
  /** Questions on the employer's application form, beyond name, contact and CV */
  applicationQuestions?: string[];
}

export interface Gate {
  status: GateStatus;
  note: string;
}

export interface Dimension {
  name: string;
  /** 1 (weak) to 5 (strong) */
  strength: number;
  note: string;
}

export interface Keyword {
  term: string;
  status: "covered" | "added" | "absent";
  note?: string;
}

export interface Evaluation {
  jobId: string;
  verdict: Verdict;
  score: number;
  headline: string;
  reasons: string[];
  eligibility: Gate;
  language: Gate;
  dimensions: Dimension[];
  gaps: string[];
  keywords: Keyword[];
}

export interface CvSection {
  label: string;
  master: string;
  tailored: string;
}

export interface ReadyCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface TailoredDocuments {
  jobId: string;
  version: number;
  sections: CvSection[];
  coverLetter: string[];
  checks: ReadyCheck[];
}

export type ApplicationStatus = "saved" | "applied" | "interview" | "closed";

export interface TimelineEvent {
  date: string;
  label: string;
}

export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  outcome?: string;
  nextStep: string;
  timeline: TimelineEvent[];
  /** e.g. "Oct 1"; absent for drafts */
  appliedOn?: string;
  roleType?: string;
  channel?: "Job site" | "Email" | "Employer portal";
  contact?: string;
  /** e.g. "Oct 27" */
  deadline?: string;
  /** Days until the deadline, used to sort and to soften the tone */
  deadlineInDays?: number;
  cvReady?: boolean;
  letterReady?: boolean;
}

export type Fit = "high" | "medium" | "low";

export interface ScrapeRun {
  /** e.g. "Oct 15" */
  date: string;
  count: number;
}

export interface BoardPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  /** e.g. "Oct 14" */
  posted: string;
  firstSeen: string;
  fit: Fit;
  note?: string;
  deadline?: string;
  /** Links to the full job page when the posting has been evaluated */
  jobId?: string;
}

export interface TodoItem {
  when: string;
  text: string;
}

export interface Material {
  kind: "CV" | "Cover letter" | "Company notes";
  name: string;
  forJob: string;
}

export interface JobBoard {
  updated: string;
  recorded: number;
  fits: MatchTiers;
  sources: DigestSource[];
  statuses: { label: string; count: number }[];
  runs: ScrapeRun[];
  todo: TodoItem[];
  backlog: BoardPosting[];
  today: { date: string; total: number; postings: BoardPosting[]; log: string[] };
  materials: Material[];
}

export interface DigestGroup {
  reason: string;
  count: number;
  examples: string[];
}

export interface DigestSource {
  name: string;
  count: number;
}

/** Fit-score bands. Only `high` matches are shown in the digest. */
export interface MatchTiers {
  high: number;
  medium: number;
  low: number;
}

export interface Digest {
  /** e.g. "Thursday, October 15" */
  date: string;
  /** e.g. "9:00 a.m." */
  time: string;
  sources: DigestSource[];
  tiers: MatchTiers;
  /** Job ids of today's high matches */
  picks: string[];
  /** Why the medium and low matches were not shown */
  setAside: DigestGroup[];
}

export interface InterviewQuestion {
  question: string;
  why: string;
  answerFrom: string;
}

export interface InterviewPrep {
  jobId: string;
  focus: string[];
  questions: InterviewQuestion[];
  askThem: string[];
}

export interface Preferences {
  emailDigest: boolean;
  breathePause: boolean;
  followUpNudges: boolean;
}
