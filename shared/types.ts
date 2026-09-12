export type JurisdictionType = "federal" | "state" | "jpml";

export type CaseCategory =
  | "mdl"
  | "consolidated"
  | "individual"
  | "jpml_pending"
  | "state_mcl"
  | "state_jccp"
  | "state_clc"
  | "state_general";

export type CaseStatus = "active" | "stayed" | "settling" | "closed";

export interface CaseRecord {
  id: string;
  name: string;
  shortName: string;
  category: CaseCategory;
  jurisdictionType: JurisdictionType;
  court: string;
  jurisdictionLabel: string;
  docketNo: string;
  judge?: string;
  status: CaseStatus;
  openedDate: string;
  practiceArea: string;
  description: string;
}

export type DocketType = "order" | "motion" | "notice" | "cmo" | "report" | "filing";

export interface DocketEntry {
  id: string;
  caseId: string;
  entryNo: string;
  filedDate: string;
  title: string;
  text: string;
  type: DocketType;
  fileIds: string[];
}

export type FileType = "pdf" | "zip" | "docx";
export type FileTag = "order" | "motion" | "notice" | "report" | "exhibit" | "cmo";

export interface FileRecord {
  id: string;
  caseId: string;
  docketId: string;
  name: string;
  type: FileType;
  tag: FileTag;
  sizeLabel: string;
  addedDate: string;
  previewUrl?: string;
}

export type UserRole = "Admin" | "Managing Clerk" | "Lit Paralegal" | "Associate" | "Partner";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  status: "active" | "invited";
  createdDate: string;
}

export interface AssignmentRecord {
  id: string;
  caseId: string;
  userId: string;
  teamRole: string;
}

export type ReminderKind = "days_before" | "hours_before" | "same_day_time" | "custom";

export interface ReminderRule {
  id: string;
  kind: ReminderKind;
  enabled: boolean;
  time?: string;
  daysBefore?: number;
  hoursBefore?: number;
  customUnit?: "minutes" | "hours" | "days";
  customValue?: number;
}

export type EventType =
  | "Filing deadline"
  | "Hearing"
  | "Case management conf."
  | "Internal review"
  | "Reminder";

export interface CalendarEventRecord {
  id: string;
  caseId: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  reminders: ReminderRule[];
  attendeeUserIds: string[];
  note?: string;
  draftedMessage?: string;
  linkedDocketId?: string;
}

export type DayType = "calendar" | "court";

export interface JurisdictionRule {
  id: string;
  jurisdictionType: JurisdictionType;
  jurisdictionLabel: string;
  citation: string;
  description: string;
  triggerEvent: string;
  days: number;
  dayType: DayType;
  rollForward: boolean;
  formatting?: {
    font?: string;
    fontSize?: string;
    pageLimit?: string;
    wordLimit?: string;
  };
  source?: string;
}

export type DeadlineStatus = "upcoming" | "calendared" | "past";

export interface TriggeredDeadline {
  id: string;
  caseId: string;
  ruleId: string;
  triggerDate: string;
  computedDate: string;
  label: string;
  status: DeadlineStatus;
  calendarEventId?: string;
}
