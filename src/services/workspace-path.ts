/** Encode workspace slug/id for Rails path segments */
export function wsPathSegment(slug: string): string {
  return encodeURIComponent(slug)
}
