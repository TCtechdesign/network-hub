import { NextRequest } from "next/server";
import {
  createInvalidMacLookupResult,
  createMacLookupResult,
  getKnownVendor,
  parseMacAddress,
} from "@/lib/macLookup";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const rawMac = request.nextUrl.searchParams.get("mac") ?? "";
  const parsed = parseMacAddress(rawMac);

  if (!parsed) {
    return Response.json(createInvalidMacLookupResult(rawMac, elapsed(startedAt)), {
      status: 400,
    });
  }

  const vendor = getKnownVendor(parsed.oui);

  return Response.json(
    createMacLookupResult(
      parsed.formatted,
      vendor,
      elapsed(startedAt),
      vendor ? "Built-in OUI lookup" : "Local MAC analysis"
    )
  );
}

function elapsed(startedAt: number) {
  return Date.now() - startedAt;
}
