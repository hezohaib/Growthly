import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/data";

export function GET() {
  return NextResponse.json(getAnalytics());
}
