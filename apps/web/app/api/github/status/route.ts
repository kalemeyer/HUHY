import { isTriageRole, requirePilotUser } from "@/app/lib/auth";
import { checkGitHubConnection } from "@/app/lib/github";

export async function GET(request: Request) {
  try {
    const user = await requirePilotUser(request);
    if (!isTriageRole(user.role))
      return Response.json(
        { error: "Steward or triager access is required." },
        { status: 403 },
      );
    const status = await checkGitHubConnection();
    return Response.json(
      {
        connected: status.connected,
        configured: status.configured,
        repository: status.repository,
        url: status.url,
        authMode: status.authMode,
        syncMode: "Live refresh from GitHub labels",
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unable to check GitHub." }, { status: 500 });
  }
}
