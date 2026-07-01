export const runtime = "nodejs";

const defaultPayloadBytes = 1_250_000;
const maxPayloadBytes = 5_000_000;

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.has("ping")) {
    return Response.json(
      {
        status: "ok",
        serverTime: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  const size = normalizePayloadSize(url.searchParams.get("size"));
  const payload = createPayload(size);
  const body = payload.buffer.slice(
    payload.byteOffset,
    payload.byteOffset + payload.byteLength
  );

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Encoding": "identity",
      "Content-Length": String(size),
      "Content-Type": "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = await request.arrayBuffer();

  return Response.json(
    {
      status: "ok",
      receivedBytes: body.byteLength,
      serverMs: Date.now() - startedAt,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

function normalizePayloadSize(value: string | null) {
  const parsedSize = Number(value);

  if (!Number.isFinite(parsedSize)) {
    return defaultPayloadBytes;
  }

  return Math.min(Math.max(Math.floor(parsedSize), 1_024), maxPayloadBytes);
}

function createPayload(size: number) {
  const payload = new Uint8Array(size);

  for (let index = 0; index < size; index += 1) {
    payload[index] = (index * 31 + 17) % 256;
  }

  return payload;
}
