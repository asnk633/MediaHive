import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "../../_lib/session";


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ status: "success" });
    clearSessionCookies(response);
    response.cookies.delete("__session");
    return response;
}
