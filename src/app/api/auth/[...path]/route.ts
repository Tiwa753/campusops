import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyAuthRequest(
  request: NextRequest,
  context: RouteContext,
) {
  if (request.method !== "GET" && request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  const { path } = await context.params;
  const backendUrl = process.env.CAMPUSOPS_API_URL ?? "http://127.0.0.1:8000";
  const endpoint = new URL(
    `/auth/${path.map(encodeURIComponent).join("/")}`,
    backendUrl,
  );
  const headers = new Headers();
  for (const name of ["cookie", "origin", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const backendResponse = await fetch(endpoint, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": "application/json",
    });
    const setCookie = backendResponse.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("Set-Cookie", setCookie);
    const responseBody = (await backendResponse.json()) as {
      detail?: string;
      error?: string;
    };
    if (!backendResponse.ok && responseBody.detail && !responseBody.error) {
      responseBody.error = responseBody.detail;
    }
    return NextResponse.json(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Python authentication backend request failed.", error);
    return NextResponse.json(
      {
        error:
          "The Python authentication service is unavailable. Start the FastAPI backend and try again.",
      },
      { status: 503 },
    );
  }
}

export const GET = proxyAuthRequest;
export const POST = proxyAuthRequest;
