/** Display format: `11 ส.ค. 2569` (Buddhist year, Asia/Bangkok) — ui-design-system.md 11.3. */
export function formatDate(dateString: string, style: "short" | "long" = "short"): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

/** `HH:mm` -> `09:30 น.` */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":");
  if (!hours || !minutes) return timeString;
  return `${hours.padStart(2, "0")}:${minutes} น.`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
