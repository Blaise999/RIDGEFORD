import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function json(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function ok(data: any = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(status: number, message: string, extra: any = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) return fail(e.status, e.message);
  const msg = (e as any)?.message || "Internal error";
  console.error("[api]", msg);
  return fail(500, msg);
}
