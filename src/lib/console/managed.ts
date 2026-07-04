/**
 * Managed ("auth51 cloud") control plane — the SaaS default.
 *
 * A signed-in customer shouldn't have to paste an endpoint: the console points
 * at the shared authority automatically. Endpoint + exchange audience are
 * deploy config (NEXT_PUBLIC_*), because the audience must match the authority
 * trusted-issuer's `default_authority_audiences` for the RFC 8693 exchange to
 * succeed. The app is keyed to the customer's org slug so the console queries
 * the same app_id the embed registers under (see the onboarding snippet).
 */
import type { ControlPlaneContext } from './controlPlane'

export const MANAGED_AUTHORITY_URL =
  process.env.NEXT_PUBLIC_AUTH51_AUTHORITY_URL?.replace(/\/$/, '') ||
  'https://authority.auth51.com'

/** Must equal the console trusted-issuer's default_authority_audiences on the authority. */
export const MANAGED_AUDIENCE =
  process.env.NEXT_PUBLIC_AUTH51_MANAGED_AUDIENCE || 'authority.auth51.com'

export const MANAGED_CONTEXT_NAME = 'auth51 cloud'

/**
 * Build the managed control-plane context for this customer. `orgSlug` (from
 * Clerk) becomes the default app_id so agents the customer registers via the
 * embed (app_id=<org>) show up in the console without extra configuration.
 */
export function makeManagedContext(orgSlug?: string | null): ControlPlaneContext {
  const appId = (orgSlug && orgSlug.trim()) || 'default'
  return {
    name: MANAGED_CONTEXT_NAME,
    endpoint: MANAGED_AUTHORITY_URL,
    audience: MANAGED_AUDIENCE,
    appId,
    addedAt: Date.now(),
  }
}
