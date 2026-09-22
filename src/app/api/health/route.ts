import { NextResponse } from 'next/server';

/**
 * Liveness for the container healthcheck and for Dokploy/Traefik.
 *
 * At `/api/health` to match `naijareels-web`, the estate's other Next app on
 * this stack — a healthcheck path is the kind of thing an operator should be
 * able to guess once and reuse.
 *
 * Deliberately says nothing about the API. A health endpoint that fails when a
 * DEPENDENCY is down invites the orchestrator to restart this container over a
 * problem restarting cannot fix, and then to keep restarting it. This answers
 * one question: is the Next server up and serving?
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'dutycaptain-web',
    ts: new Date().toISOString()
  });
}
