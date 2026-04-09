import { NextResponse } from "next/server";

const BASE = "https://www.dhlottery.co.kr";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/selectMainInfo.do?_=${Date.now()}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: `${BASE}/`,
        requestmenuuri: "/",
        "X-Requested-With": "XMLHttpRequest",
        ajax: "true",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    });
    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: res.status });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
