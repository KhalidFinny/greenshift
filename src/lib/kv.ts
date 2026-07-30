import type { RequestContext } from '@tanstack/react-start'

let _kv: KVNamespace | null = null

/**
 * Init KV from Cloudflare request context.
 * Returns null when KV binding is not configured (dev mode).
 */
export function initKv(context?: RequestContext): KVNamespace | null {
  if (context?.cloudflare?.env?.KV) {
    _kv = context.cloudflare.env.KV as KVNamespace
    return _kv
  }
  return null
}

export function getKv(): KVNamespace {
  if (!_kv) {
    throw new Error('KV not initialized. Configure KV in wrangler.jsonc or call initKv().')
  }
  return _kv
}

// ── Generic helpers ─────────────────────────────────────

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = await getKv().get(key)
  if (!raw) return null
  return JSON.parse(raw) as T
}

export async function kvSet<T>(
  key: string,
  value: T,
  ttl?: number,
): Promise<void> {
  await getKv().put(key, JSON.stringify(value), {
    expirationTtl: ttl ?? 300,
  })
}

export async function kvDelete(key: string): Promise<void> {
  await getKv().delete(key)
}

// ── Domain-specific keys ────────────────────────────────

const PREFIX = 'greenshift:'

export function marketProjectsKey() {
  return `${PREFIX}market:projects`
}

export function vendorRecommendationsKey(projectId: number) {
  return `${PREFIX}vendor:recs:${projectId}`
}

export function projectDetailKey(id: number) {
  return `${PREFIX}project:${id}`
}

export function userSessionKey(userId: number) {
  return `${PREFIX}session:${userId}`
}

export function dashboardCacheKey(role: string, userId: number) {
  return `${PREFIX}dashboard:${role}:${userId}`
}
