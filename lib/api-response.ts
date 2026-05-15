import { NextResponse } from 'next/server';

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function apiUnauthorized(message = 'Authentication required') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function apiForbidden(message = 'Insufficient permissions') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function apiNotFound(message = 'Resource not found') {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}
