export function requireSameOrigin(request: Request): Response | null {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (url.hostname === "localhost" && !origin) return null;
  if (!origin || origin !== url.origin) {
    return Response.json(
      { error: "This request did not come from the HUHY site." },
      { status: 403 },
    );
  }
  return null;
}

export async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<Record<string, unknown>> {
  if (!request.body)
    throw Response.json(
      { error: "A JSON request body is required." },
      { status: 400 },
    );
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        throw Response.json(
          { error: "Request body is too large." },
          { status: 413 },
        );
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
}
