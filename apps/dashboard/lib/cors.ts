import { NextResponse } from "next/server";
import type { FormSchemaV1 } from "@fieldo/types";

export function corsHeaders(origin: string | null, schema?: FormSchemaV1): Record<string, string> {
  const allowed = schema?.settings.allowedOrigins;
  const allowOrigin = !allowed || allowed.length === 0 ? "*" : allowed.includes(origin ?? "") ? origin! : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}

export function corsJson(data: unknown, init: ResponseInit, origin: string | null, schema?: FormSchemaV1) {
  return NextResponse.json(data, { ...init, headers: { ...(init.headers as object), ...corsHeaders(origin, schema) } });
}
