import { redirect } from "next/navigation";

// The job board moved to /dashboard.
export default function ApplicationsRedirect() {
  redirect("/dashboard");
}
