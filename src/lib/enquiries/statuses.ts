/** Enquiry workflow states. Values match the database check constraint. */
export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]["value"];

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string | null;
  mode: string | null;
  message: string;
  status: EnquiryStatus;
  email_sent: boolean;
  created_at: string;
}

/** "13 Sep 2026, 2:05 pm", in Singapore time. */
export function formatSingaporeTime(iso: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
