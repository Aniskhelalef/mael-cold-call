import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.APIFY_TOKEN ?? "";

function noToken() {
  return NextResponse.json({ error: "APIFY_TOKEN manquant dans .env.local" }, { status: 500 });
}

// POST — start a scraping run
export async function POST(req: NextRequest) {
  if (!TOKEN) return noToken();

  const { searchTerm, location, maxResults } = await req.json();

  const r = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${encodeURIComponent(TOKEN)}`,
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
    return NextResponse.json({ error: await r.text() }, { status: r.status });
  }

  const { data } = await r.json();
  return NextResponse.json({ runId: data.id, datasetId: data.defaultDatasetId });
}

// GET — poll run status; return items when succeeded
export async function GET(req: NextRequest) {
  if (!TOKEN) return noToken();

  const runId = req.nextUrl.searchParams.get("runId") ?? "";

  const r = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(TOKEN)}`
  );
  if (!r.ok) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });

  const { data } = await r.json();

  if (data.status === "SUCCEEDED") {
    const ir = await fetch(
      `https://api.apify.com/v2/datasets/${data.defaultDatasetId}/items` +
      `?token=${encodeURIComponent(TOKEN)}&clean=true&format=json&limit=1000`
    );
    const items = await ir.json();
    return NextResponse.json({ status: "SUCCEEDED", items: Array.isArray(items) ? items : [] });
  }

  if (["FAILED", "ABORTED", "TIMED-OUT"].includes(data.status)) {
    return NextResponse.json({ status: data.status });
  }

  return NextResponse.json({ status: data.status });
}
