// src/app/api/_lib/http.ts
import { NextRequest, NextResponse } from "next/server";

export type ListResponse<T> = { data: T[]; nextCursor?: string | null; meta?: { count?: number } };
export type OneResponse<T> = { data: T };
export type ErrResponse = { error: { code: string; message: string } };

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json<T extends any[] ? ListResponse<T[number]> : OneResponse<T>>(
    // When T is an array we return a ListResponse, otherwise OneResponse.
    // Narrowing to `any` here prevents a complex conditional generic error
    // that TypeScript sometimes produces with the inferred union.
    (Array.isArray(data)
      ? ({ data, meta: { count: data.length } } as unknown as any)
      : ({ data } as unknown as any)),
    init
  );

export const noContent = () => new NextResponse(null, { status: 204 });

export const bad = (message = "Bad Request", code = "BAD_REQUEST", status = 400) =>
  NextResponse.json<ErrResponse>({ error: { code, message } }, { status });

export const notFound = (message = "Not Found", code = "NOT_FOUND") =>
  NextResponse.json<ErrResponse>({ error: { code, message } }, { status: 404 });

export const serverErr = (message = "Server Error", code = "SERVER_ERROR") =>
  NextResponse.json<ErrResponse>({ error: { code, message } }, { status: 500 });

export function getSearchParam(req: NextRequest, key: string) {
  return req.nextUrl.searchParams.get(key) ?? undefined;
}