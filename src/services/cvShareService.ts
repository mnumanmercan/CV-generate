import type { CVData } from '@/types/cv.types'
import { apiClient } from './apiClient'

// ─── Public CV sharing (API-only) ─────────────────────────────────────────────
// Manages the share link for a logged-in user's CV and resolves public links.
// Kept separate from the storage delegate (which stays backend-agnostic for
// guests) — these endpoints only exist for authenticated, server-backed CVs.

export interface ShareStatus {
  /** null when the CV is private (no active share link). */
  slug: string | null
}

export interface PublicCV {
  title: string
  content: CVData
}

/**
 * Resolve the id of the user's most-recently-updated CV.
 *
 * This is a FALLBACK only. Now that a user can hold several CV versions,
 * callers that know which version they mean must pass its id explicitly
 * (cvStore.activeVariantId, or the row id on a dashboard card) — "most
 * recently updated" is not the same as "the one on screen". It remains the
 * right answer for a cold path with no id in hand, and for accounts that
 * still have exactly one CV. Returns null when the user has no CV yet.
 */
export async function resolveActiveCvId(): Promise<string | null> {
  const res = await apiClient.get<{
    success: boolean
    data: Array<{ id: string; updatedAt: string }>
  }>('/cv')
  return res.data?.[0]?.id ?? null
}

export async function getShareStatus(cvId: string): Promise<ShareStatus> {
  const res = await apiClient.get<{ success: boolean; data: ShareStatus }>(`/cv/${cvId}/share`)
  return res.data
}

export async function createShareLink(cvId: string): Promise<ShareStatus> {
  const res = await apiClient.post<{ success: boolean; data: { slug: string } }>(
    `/cv/${cvId}/share`,
  )
  return res.data
}

export async function regenerateShareLink(cvId: string): Promise<ShareStatus> {
  const res = await apiClient.post<{ success: boolean; data: { slug: string } }>(
    `/cv/${cvId}/share/regenerate`,
  )
  return res.data
}

export async function removeShareLink(cvId: string): Promise<void> {
  await apiClient.delete(`/cv/${cvId}/share`)
}

/** Unauthenticated fetch of a publicly shared CV. Throws ApiError(404) when the slug is invalid. */
export async function fetchPublicCV(slug: string): Promise<PublicCV> {
  const res = await apiClient.get<{ success: boolean; data: PublicCV }>(
    `/public/cv/${encodeURIComponent(slug)}`,
  )
  return res.data
}

/** Build the absolute share URL shown to / copied by the user. */
export function buildShareUrl(slug: string): string {
  return `${window.location.origin}/p/${slug}`
}
