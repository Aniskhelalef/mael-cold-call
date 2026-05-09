import { NextRequest, NextResponse } from "next/server";

// POST — start a scraping run
export async function POST(req: NextRequest) {
  const { token, searchTerm, location, maxResults } = await req.json();

  if (!token?.trim()) {
    return NextResponse.json({ error: "Token Apify manquant" }, { status: 400 });
  }

  const r = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStrings: [searchTerm.trim()],
        locationQuery: `${location.trim()}, France`,
        maxCrawledPlacesPerSearch: Math.min(Number(maxResults) || 100, 500),
        language: "fr",
        exportPlaceUrls: false,
      }),
    }
  );

  if (!r.ok) {
    const msg = await r.text();
    return NextResponse.json({ error: msg }, { status: r.status });
  }

  const { data } = await r.json();
  return NextResponse.json({ runId: data.id, datasetId: data.defaultDatasetId });
}

// GET — poll run status; return items when succeeded
export async function GET(req: NextRequest) {
  const token   = req.nextUrl.searchParams.get("token") ?? "";
  const runId   = req.nextUrl.searchParams.get("runId") ?? "";

  const r = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(token)}`
  );
  if (!r.ok) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });

  const { data } = await r.json();

  if (data.status === "SUCCEEDED") {
    const ir = await fetch(
      `https://api.apify.com/v2/datasets/${data.defaultDatasetId}/items` +
      `?token=${encodeURIComponent(token)}&clean=true&format=json&limit=1000`
    );
    const items = await ir.json();
    return NextResponse.json({ status: "SUCCEEDED", items: Array.isArray(items) ? items : [] });
  }

  if (["FAILED", "ABORTED", "TIMED-OUT"].includes(data.status)) {
    return NextResponse.json({ status: data.status });
  }

  return NextResponse.json({ status: data.status });
}
