export function toDate(raw: string): Date | null {
  if (!raw || raw === "NONE") return null
  return new Date(raw.replace(" ", "T") + "+06:00")
}
