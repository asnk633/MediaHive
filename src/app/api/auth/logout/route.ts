import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ status: "success" });
    response.cookies.set("__session", "", {
        maxAge: 0,
        path: "/",
        secure: process.env.NODE_ENV === 'production'
    });
    return response;
}
