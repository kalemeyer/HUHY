import { ensureSchema } from '@/db';

export type PilotUser = { userId: string; email: string; displayName: string; role: 'member'|'triager'|'maintainer'|'steward' };

function decodeFullName(value: string | null, encoding: string | null): string | null {
  if (!value || encoding !== 'percent-encoded-utf-8') return null;
  try { return decodeURIComponent(value); } catch { return null; }
}

export async function getOptionalPilotUser(request: Request): Promise<PilotUser|null> {
  const url = new URL(request.url);
  const userId = request.headers.get('oai-authenticated-user-id') ?? (url.hostname === 'localhost' ? 'local-owner' : null);
  const email = request.headers.get('oai-authenticated-user-email') ?? (url.hostname === 'localhost' ? 'local-owner@sites.test' : null);
  if (!userId || !email) return null;
  const displayName = decodeFullName(request.headers.get('oai-authenticated-user-full-name'), request.headers.get('oai-authenticated-user-full-name-encoding')) ?? email;
  const db = await ensureSchema();
  const initialRole=url.hostname==='localhost'?'steward':'member';
  await db.prepare(`INSERT INTO users (id,email,display_name,role) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, updated_at=CURRENT_TIMESTAMP`).bind(userId,email,displayName,initialRole).run();
  const user = await db.prepare(`SELECT id AS userId,email,display_name AS displayName,role FROM users WHERE id=?`).bind(userId).first<PilotUser>();
  if (!user) throw new Response(JSON.stringify({ error:'Unable to establish the signed-in user.' }), { status:500, headers:{'content-type':'application/json'} });
  return user;
}

export async function requirePilotUser(request: Request): Promise<PilotUser> {
  const user=await getOptionalPilotUser(request);
  if (!user) throw new Response(JSON.stringify({ error:'Sign in is required.' }), { status:401, headers:{'content-type':'application/json'} });
  return user;
}

export function isTriageRole(role: PilotUser['role']): boolean { return role === 'triager' || role === 'steward'; }
