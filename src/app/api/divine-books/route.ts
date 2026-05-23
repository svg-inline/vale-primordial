import { NextResponse } from "next/server";
import { getDivineBookCatalogServer } from "@/lib/queries/divine-books";

export async function GET() {
  const catalog = await getDivineBookCatalogServer();

  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
