import type {
  Application,
  Evaluation,
  InterviewPrep,
  Job,
  Profile,
  SearchRound,
  TailoredDocuments,
} from "@/lib/data";

/** Everything the chat demo needs, loaded on the server and passed in once. */
export interface ChatData {
  profile: Profile;
  jobs: Job[];
  evaluations: Record<string, Evaluation>;
  tailored: Record<string, TailoredDocuments>;
  applications: Application[];
  preps: Record<string, InterviewPrep>;
  questions: Record<string, string[]>;
  rounds: SearchRound[];
  /** Days since each sample application was sent, as of the demo's "today" */
  daysSinceApplied: Record<string, number>;
}
