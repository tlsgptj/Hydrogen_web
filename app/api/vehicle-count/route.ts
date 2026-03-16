import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://ai.hydrogen-cctv.com/vehicle-count", {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "외부 API 요청 실패" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy API error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류" },
      { status: 500 }
    );
  }
}