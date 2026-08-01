import type { Database } from "@/lib/supabase/types";

export type OrgRole = "owner" | "staff" | "member";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgMember = Database["public"]["Tables"]["org_members"]["Row"];
export type OrgInvite = Database["public"]["Tables"]["org_invites"]["Row"];
export type PerformanceShow =
  Database["public"]["Tables"]["performance_shows"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type ShowAvailability =
  Database["public"]["Views"]["show_availability"]["Row"];

export type Recruitment = Database["public"]["Tables"]["recruitments"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type Rehearsal = Database["public"]["Tables"]["rehearsals"]["Row"];
export type RehearsalAttendance =
  Database["public"]["Tables"]["rehearsal_attendances"]["Row"];

export type ReservationStatus = Reservation["status"];
export type AnnouncementAudience = Announcement["audience"];
export type ApplicationStatus = Application["status"];
export type AttendanceStatus = RehearsalAttendance["status"];
export type Visibility = "public" | "unlisted" | "private";

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "접수",
  screening: "서류심사",
  audition: "오디션",
  passed: "합격",
  rejected: "불합격",
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  going: "참석",
  not: "불참",
  maybe: "미정",
};

export const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "소유자",
  staff: "운영진",
  member: "단원",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "대기",
  confirmed: "확정",
  cancelled: "취소",
  no_show: "노쇼",
};

/** owner/staff는 관리 권한을 가진다. */
export function isStaffRole(role: OrgRole | null | undefined): boolean {
  return role === "owner" || role === "staff";
}
