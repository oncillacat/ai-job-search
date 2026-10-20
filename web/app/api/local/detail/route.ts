import { helperDisabled, helperHeaders, helperPreflight } from "@/lib/local-helper-cors";
import { postingDetail } from "@/lib/search/detail";

// Local search helper: reads one posting's full text from this computer, for tailoring.

export function OPTIONS(request: Request) {
  return helperPreflight(request);
}

export async function POST(request: Request) {
  if (helperDisabled()) return new Response(null, { status: 404 });
  const h = helperHeaders(request);
  if (!h) return new Response(null, { status: 403 });
  const p = (await request.json().catch(() => null)) as { id?: unknown; snippet?: unknown } | null;
  const id = typeof p?.id === "string" ? p.id.slice(0, 120) : "";
  if (!/^(jb|li|az|jo)-[\w.-]+$/.test(id)) return Response.json({ message: "Unknown posting." }, { status: 400, headers: h });
  const detail = await postingDetail({
    id,
    title: "",
    company: "",
    location: "",
    portal: "",
    posted: "",
    url: "",
    snippet: typeof p?.snippet === "string" ? p.snippet.slice(0, 1200) : undefined,
  });
  return Response.json(detail, { headers: h });
}
