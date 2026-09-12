import type {
  CaseRecord,
  UserRecord,
  AssignmentRecord,
  DocketEntry,
  FileRecord,
  CalendarEventRecord,
  TriggeredDeadline,
  ReminderKind,
  ReminderRule,
} from "./types";
import { ruleById } from "./rules/jurisdictions";
import { computeDeadlineDate } from "./rules/engine";

/**
 * Synthetic demo data only. Case captions below reference well-known, publicly
 * reported mass-tort/MDL litigation for realistic flavor; docket text, dates,
 * and file records are fabricated for this prototype. No firm case data.
 */

export const USERS: UserRecord[] = [
  {
    id: "u-mgarner",
    name: "Mark Garner",
    email: "mark.garner@seegerweiss.example",
    role: "Managing Clerk",
    title: "Managing Clerk",
    status: "active",
    createdDate: "2026-01-06",
  },
  {
    id: "u-ssiegal",
    name: "Scott Siegal",
    email: "scott.siegal@seegerweiss.example",
    role: "Lit Paralegal",
    title: "Litigation Paralegal",
    status: "active",
    createdDate: "2026-01-06",
  },
  {
    id: "u-pnandakumar",
    name: "Priya Nandakumar",
    email: "priya.nandakumar@seegerweiss.example",
    role: "Lit Paralegal",
    title: "Litigation Paralegal",
    status: "active",
    createdDate: "2026-02-02",
  },
  {
    id: "u-dwhitfield",
    name: "Dana Whitfield",
    email: "dana.whitfield@seegerweiss.example",
    role: "Associate",
    title: "Associate Attorney",
    status: "active",
    createdDate: "2026-02-02",
  },
  {
    id: "u-alipsky",
    name: "Aaron Lipsky",
    email: "aaron.lipsky@seegerweiss.example",
    role: "Partner",
    title: "Partner",
    status: "active",
    createdDate: "2026-01-06",
  },
  {
    id: "u-jkowalski",
    name: "Jamie Kowalski",
    email: "jamie.kowalski@seegerweiss.example",
    role: "Lit Paralegal",
    title: "Litigation Paralegal",
    status: "invited",
    createdDate: "2026-09-02",
  },
];

export const CASES: CaseRecord[] = [
  {
    id: "c01",
    name: "In re: Zantac (Ranitidine) Products Liability Litigation",
    shortName: "Zantac MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, S.D. Fla.",
    jurisdictionLabel: "S.D. Fla.",
    docketNo: "9:20-md-02924",
    judge: "Hon. Robin L. Rosenberg",
    status: "active",
    openedDate: "2020-02-06",
    practiceArea: "Pharmaceutical Products Liability",
    description: "Consolidated proceedings alleging ranitidine (Zantac) exposure caused cancer.",
  },
  {
    id: "c02",
    name: "In re: Roundup Products Liability Litigation",
    shortName: "Roundup MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, N.D. Cal.",
    jurisdictionLabel: "N.D. Cal.",
    docketNo: "3:16-md-02741",
    judge: "Hon. Vince Chhabria",
    status: "active",
    openedDate: "2016-10-03",
    practiceArea: "Herbicide Products Liability",
    description: "Consolidated proceedings alleging glyphosate-based Roundup herbicide caused non-Hodgkin lymphoma.",
  },
  {
    id: "c03",
    name: "In re: Paraquat Products Liability Litigation",
    shortName: "Paraquat MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, S.D. Ill.",
    jurisdictionLabel: "S.D. Ill.",
    docketNo: "3:21-md-03004",
    judge: "Hon. Nancy J. Rosenstengel",
    status: "active",
    openedDate: "2021-06-08",
    practiceArea: "Agricultural/Chemical Products Liability",
    description: "Consolidated proceedings alleging paraquat herbicide exposure caused Parkinson's disease.",
  },
  {
    id: "c04",
    name: "In re: 3M Combat Arms Earplug Products Liability Litigation",
    shortName: "3M Combat Arms",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, N.D. Fla.",
    jurisdictionLabel: "N.D. Fla.",
    docketNo: "3:19-md-02885",
    judge: "Hon. M. Casey Rodgers",
    status: "settling",
    openedDate: "2019-04-03",
    practiceArea: "Defense/Military Products Liability",
    description: "Consolidated proceedings alleging defective dual-ended earplugs caused hearing loss/tinnitus; now largely in settlement administration.",
  },
  {
    id: "c05",
    name: "In re: Social Media Adolescent Addiction / Personal Injury Products Liability Litigation",
    shortName: "Social Media MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, N.D. Cal.",
    jurisdictionLabel: "N.D. Cal.",
    docketNo: "4:22-md-03047",
    judge: "Hon. Yvonne Gonzalez Rogers",
    status: "active",
    openedDate: "2022-10-06",
    practiceArea: "Consumer Protection / Mass Tort",
    description: "Consolidated proceedings alleging social media platform design caused adolescent mental-health harm.",
  },
  {
    id: "c06",
    name: "In re: Acetaminophen — ASD/ADHD Products Liability Litigation",
    shortName: "Acetaminophen MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, S.D.N.Y.",
    jurisdictionLabel: "S.D.N.Y.",
    docketNo: "1:22-md-03043",
    judge: "Hon. Denise L. Cote",
    status: "active",
    openedDate: "2022-10-05",
    practiceArea: "Pharmaceutical Products Liability",
    description: "Consolidated proceedings alleging prenatal acetaminophen exposure is linked to ASD/ADHD.",
  },
  {
    id: "c07",
    name: "In re: Aqueous Film-Forming Foams (AFFF) Products Liability Litigation",
    shortName: "AFFF MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, D.S.C.",
    jurisdictionLabel: "D.S.C.",
    docketNo: "2:18-mn-02873",
    judge: "Hon. Richard M. Gergel",
    status: "active",
    openedDate: "2018-12-07",
    practiceArea: "Environmental / Toxic Tort",
    description: "Consolidated proceedings alleging PFAS-containing firefighting foam contaminated water supplies and caused injury.",
  },
  {
    id: "c08",
    name: "In re: Ozempic (Semaglutide) Products Liability Litigation",
    shortName: "Ozempic MDL",
    category: "mdl",
    jurisdictionType: "federal",
    court: "U.S. District Court, N.D. Ga.",
    jurisdictionLabel: "N.D. Ga.",
    docketNo: "1:24-md-03094",
    status: "active",
    openedDate: "2024-02-02",
    practiceArea: "Pharmaceutical Products Liability",
    description: "Consolidated proceedings alleging GLP-1 receptor agonist drugs caused gastrointestinal injury.",
  },
  {
    id: "c09",
    name: "In re: Camp Lejeune Water Litigation",
    shortName: "Camp Lejeune",
    category: "consolidated",
    jurisdictionType: "federal",
    court: "U.S. District Court, E.D.N.C.",
    jurisdictionLabel: "E.D.N.C.",
    docketNo: "7:23-cv-00897",
    judge: "Hon. James C. Dever III",
    status: "active",
    openedDate: "2023-03-14",
    practiceArea: "Environmental / Toxic Tort",
    description: "Claims under the Camp Lejeune Justice Act alleging contaminated base water supply caused injury.",
  },
  {
    id: "c10",
    name: "Doe v. Acme Aviation Corp.",
    shortName: "Doe v. Acme Aviation",
    category: "individual",
    jurisdictionType: "federal",
    court: "U.S. District Court, S.D.N.Y.",
    jurisdictionLabel: "S.D.N.Y.",
    docketNo: "1:26-cv-04512",
    status: "active",
    openedDate: "2026-04-20",
    practiceArea: "Aviation Products Liability",
    description: "Individual federal diversity action alleging a defective aircraft component caused injury.",
  },
  {
    id: "c11",
    name: "Ramirez v. Sterling Pharmaceutical Inc.",
    shortName: "Ramirez v. Sterling",
    category: "individual",
    jurisdictionType: "federal",
    court: "U.S. District Court, N.D. Ill.",
    jurisdictionLabel: "N.D. Ill.",
    docketNo: "1:26-cv-02890",
    status: "active",
    openedDate: "2026-05-11",
    practiceArea: "Pharmaceutical Products Liability",
    description: "Individual federal diversity action alleging a mislabeled generic drug caused injury.",
  },
  {
    id: "c12",
    name: "Torres v. BrightPath Diagnostics LLC",
    shortName: "Torres v. BrightPath",
    category: "individual",
    jurisdictionType: "federal",
    court: "U.S. District Court, C.D. Cal.",
    jurisdictionLabel: "C.D. Cal.",
    docketNo: "2:26-cv-05531",
    status: "active",
    openedDate: "2026-06-02",
    practiceArea: "Medical Device",
    description: "Individual federal diversity action alleging a defective diagnostic device caused misdiagnosis and injury.",
  },
  {
    id: "c13",
    name: "In re: ClearWave Hearing Implant Products Liability Litigation",
    shortName: "ClearWave Implant (JPML)",
    category: "jpml_pending",
    jurisdictionType: "jpml",
    court: "Judicial Panel on Multidistrict Litigation",
    jurisdictionLabel: "J.P.M.L. (pending)",
    docketNo: "Pending transfer",
    status: "active",
    openedDate: "2026-07-28",
    practiceArea: "Medical Device",
    description: "Motion for transfer and coordination of related implant-defect actions pending before the Panel.",
  },
  {
    id: "c14",
    name: "In re: Nova Rideshare Data Breach Litigation",
    shortName: "Nova Rideshare (JPML)",
    category: "jpml_pending",
    jurisdictionType: "jpml",
    court: "Judicial Panel on Multidistrict Litigation",
    jurisdictionLabel: "J.P.M.L. (pending)",
    docketNo: "Pending transfer",
    status: "active",
    openedDate: "2026-08-11",
    practiceArea: "Data Privacy",
    description: "Motion for transfer and coordination of related data-breach actions pending before the Panel.",
  },
  {
    id: "c15",
    name: "In re: Talc-Based Body Powder Litigation",
    shortName: "Talc NJ MCL 300",
    category: "state_mcl",
    jurisdictionType: "state",
    court: "NJ Superior Court, Middlesex County",
    jurisdictionLabel: "NJ Superior Ct. (Middlesex)",
    docketNo: "MCL No. 300",
    status: "active",
    openedDate: "2016-09-23",
    practiceArea: "Consumer Products",
    description: "New Jersey multicounty litigation alleging talc-based body powder caused ovarian cancer/mesothelioma.",
  },
  {
    id: "c16",
    name: "In re: Accutane Litigation",
    shortName: "Accutane NJ MCL 271",
    category: "state_mcl",
    jurisdictionType: "state",
    court: "NJ Superior Court, Atlantic County",
    jurisdictionLabel: "NJ Superior Ct. (Atlantic)",
    docketNo: "MCL No. 271",
    status: "active",
    openedDate: "2005-02-08",
    practiceArea: "Pharmaceutical Products Liability",
    description: "New Jersey multicounty litigation alleging isotretinoin (Accutane) caused inflammatory bowel disease.",
  },
  {
    id: "c17",
    name: "In re: Risperdal / Invega / Zyprexa Litigation",
    shortName: "Risperdal Phila. CLC",
    category: "state_clc",
    jurisdictionType: "state",
    court: "Philadelphia Court of Common Pleas, Complex Litigation Center",
    jurisdictionLabel: "Phila. C.C.P. (CLC)",
    docketNo: "CLC — June Term 2026",
    status: "settling",
    openedDate: "2011-01-11",
    practiceArea: "Pharmaceutical Products Liability",
    description: "Philadelphia mass tort program coordinating atypical-antipsychotic gynecomastia claims; largely in post-settlement administration.",
  },
  {
    id: "c18",
    name: "In re: Roundup Cases (Judicial Council Coordination Proceeding)",
    shortName: "Roundup JCCP",
    category: "state_jccp",
    jurisdictionType: "state",
    court: "Superior Court of California, Alameda County",
    jurisdictionLabel: "Cal. Super. Ct. (Alameda) — JCCP",
    docketNo: "JCCP No. 4835",
    status: "active",
    openedDate: "2017-03-06",
    practiceArea: "Herbicide Products Liability",
    description: "California coordinated proceeding paralleling the federal Roundup MDL for state-filed claims.",
  },
  {
    id: "c19",
    name: "In re: Zantac Litigation",
    shortName: "Zantac Delaware",
    category: "state_general",
    jurisdictionType: "state",
    court: "Delaware Superior Court, Complex Commercial Litigation Division",
    jurisdictionLabel: "Del. Super. Ct. (CCLD)",
    docketNo: "N/A — Coordinated Docket",
    status: "stayed",
    openedDate: "2021-08-30",
    practiceArea: "Pharmaceutical Products Liability",
    description: "Delaware coordinated ranitidine proceedings; case management largely stayed pending federal MDL Daubert rulings.",
  },
  {
    id: "c20",
    name: "Chen v. Meridian Health Products, Inc.",
    shortName: "Chen v. Meridian Health",
    category: "individual",
    jurisdictionType: "state",
    court: "NY Supreme Court, Suffolk County",
    jurisdictionLabel: "N.Y. Sup. Ct. (Suffolk)",
    docketNo: "610234/2026",
    status: "active",
    openedDate: "2026-03-02",
    practiceArea: "Consumer Products",
    description: "Individual New York state-court action alleging a defective consumer health product caused injury.",
  },
];

const teamRow = (caseId: string, userId: string, teamRole: string): AssignmentRecord => ({
  id: `a-${caseId}-${userId}`,
  caseId,
  userId,
  teamRole,
});

export const ASSIGNMENTS: AssignmentRecord[] = [
  // Mark Garner: firm-wide managing clerk oversight across every tracked matter
  ...CASES.map((c) => teamRow(c.id, "u-mgarner", "Managing Clerk")),

  // Scott Siegal's personal paralegal caseload
  ...["c01", "c02", "c04", "c07", "c09", "c15", "c16", "c19"].map((id) => teamRow(id, "u-ssiegal", "Lit Paralegal")),

  // Priya Nandakumar's caseload
  ...["c03", "c05", "c06", "c08", "c13", "c14", "c17", "c18"].map((id) =>
    teamRow(id, "u-pnandakumar", "Lit Paralegal"),
  ),

  // Dana Whitfield, associate coverage
  ...["c02", "c05", "c06", "c09", "c11", "c20"].map((id) => teamRow(id, "u-dwhitfield", "Associate")),

  // Aaron Lipsky, lead partner on flagship MDLs
  ...["c01", "c02", "c03", "c04", "c07"].map((id) => teamRow(id, "u-alipsky", "Lead Partner")),

  // Jamie Kowalski, newly invited, light ramp-up load
  ...["c10", "c12"].map((id) => teamRow(id, "u-jkowalski", "Lit Paralegal (support)")),
];

let docketSeq = 0;
let fileSeq = 0;
const dockets: DocketEntry[] = [];
const files: FileRecord[] = [];

function docket(
  caseId: string,
  entryNo: string,
  filedDate: string,
  title: string,
  text: string,
  type: DocketEntry["type"],
  file?: { name: string; tag: FileRecord["tag"]; sizeLabel: string; type?: FileRecord["type"] },
): DocketEntry {
  docketSeq += 1;
  const id = `dk${String(docketSeq).padStart(3, "0")}`;
  const fileIds: string[] = [];
  if (file) {
    fileSeq += 1;
    const fid = `fl${String(fileSeq).padStart(3, "0")}`;
    files.push({
      id: fid,
      caseId,
      docketId: id,
      name: file.name,
      type: file.type ?? "pdf",
      tag: file.tag,
      sizeLabel: file.sizeLabel,
      addedDate: filedDate,
      previewUrl: (file.type ?? "pdf") === "pdf" ? `/sample-docs/${file.tag}.pdf` : undefined,
    });
    fileIds.push(fid);
  }
  const entry: DocketEntry = { id, caseId, entryNo, filedDate, title, text, type, fileIds };
  dockets.push(entry);
  return entry;
}

// c01 Zantac
docket(
  "c01",
  "2,924",
  "2026-09-10",
  "Case Management Order No. 14",
  "CASE MANAGEMENT ORDER NO. 14 setting Science Day and establishing the general-causation expert disclosure schedule. Plaintiffs' expert reports due Sept. 29, 2026; Defendants' responsive reports due Oct. 27, 2026.",
  "cmo",
  { name: "CMO No. 14 — Science Day Schedule.pdf", tag: "cmo", sizeLabel: "1.4 MB · 8 pages" },
);
docket(
  "c01",
  "2,918",
  "2026-08-29",
  "Defendants' Daubert Motion re General Causation",
  "MOTION to exclude plaintiffs' general-causation experts filed by Defendants. Response due per CMO 14 briefing schedule.",
  "motion",
  { name: "Daubert Motion — General Causation.pdf", tag: "motion", sizeLabel: "2.6 MB · 33 pages" },
);

// c02 Roundup
docket(
  "c02",
  "1,880",
  "2026-09-11",
  "Defendants' Daubert Motion to Exclude",
  "MOTION to exclude expert testimony (Daubert) filed by Defendants as to plaintiffs' general-causation experts. Response due Sept. 17, 2026 per local rules; reply due Sept. 24, 2026.",
  "motion",
  { name: "Daubert Motion to Exclude.pdf", tag: "motion", sizeLabel: "3.2 MB · 41 pages" },
);
docket(
  "c02",
  "1,874",
  "2026-08-20",
  "Status Report Re: Remaining Bellwether Pool",
  "STATUS REPORT by the parties regarding the composition of the remaining bellwether trial pool.",
  "report",
);

// c03 Paraquat
docket(
  "c03",
  "3,004",
  "2026-09-10",
  "Notice of Case Management Conference",
  "NOTICE of case management conference set for Sept. 22, 2026 at 10:00 a.m. Joint agenda due three business days prior.",
  "notice",
  { name: "CMC Notice.pdf", tag: "notice", sizeLabel: "160 KB · 1 page" },
);
docket(
  "c03",
  "2,977",
  "2026-08-18",
  "Order Setting Third Bellwether Trial Pool",
  "ORDER setting the schedule for selection of the third bellwether trial pool and related case-specific discovery.",
  "order",
);

// c04 3M Combat Arms
docket(
  "c04",
  "2,885",
  "2026-09-10",
  "Order Approving Settlement Distribution Procedures",
  "ORDER approving amended settlement distribution procedures and claims-administrator reporting schedule.",
  "order",
  { name: "Order Approving Distribution Procedures.pdf", tag: "order", sizeLabel: "640 KB · 6 pages" },
);
docket(
  "c04",
  "2,861",
  "2026-08-14",
  "Claims Administrator Quarterly Report",
  "REPORT by the claims administrator on settlement fund disbursement status.",
  "report",
);

// c05 Social Media MDL
docket(
  "c05",
  "1,140",
  "2026-09-09",
  "Order on Motion to Dismiss (Design-Defect Claims)",
  "ORDER granting in part and denying in part Defendants' motion to dismiss design-defect claims.",
  "order",
  { name: "Order on Motion to Dismiss.pdf", tag: "order", sizeLabel: "980 KB · 22 pages" },
);
docket(
  "c05",
  "1,102",
  "2026-08-22",
  "Plaintiffs' Steering Committee Status Report",
  "STATUS REPORT by the Plaintiffs' Steering Committee regarding census and PFS completion rates.",
  "report",
);

// c06 Acetaminophen
docket(
  "c06",
  "612",
  "2026-09-08",
  "Order Re: General Causation Ruling",
  "ORDER addressing the parties' cross-motions on general causation following the Daubert hearing.",
  "order",
  { name: "General Causation Order.pdf", tag: "order", sizeLabel: "1.1 MB · 19 pages" },
);
docket(
  "c06",
  "588",
  "2026-08-15",
  "Notice of Supplemental Authority",
  "NOTICE of supplemental authority filed by Defendants regarding a recent appellate decision.",
  "notice",
);

// c07 AFFF
docket(
  "c07",
  "4,410",
  "2026-09-05",
  "Case Management Order No. 31",
  "CASE MANAGEMENT ORDER NO. 31 setting the schedule for the next wave of personal-injury bellwether trials.",
  "cmo",
  { name: "CMO No. 31 — Bellwether Wave Schedule.pdf", tag: "cmo", sizeLabel: "1.8 MB · 14 pages" },
);
docket(
  "c07",
  "4,355",
  "2026-08-19",
  "Order on Municipal Water Provider Settlement Administration",
  "ORDER addressing implementation of the municipal water-provider settlement claims process.",
  "order",
);

// c08 Ozempic
docket(
  "c08",
  "410",
  "2026-09-04",
  "Order Setting Initial Case Management Conference",
  "ORDER setting the initial case management conference and directing submission of a proposed leadership structure.",
  "order",
  { name: "Initial CMC Order.pdf", tag: "order", sizeLabel: "410 KB · 4 pages" },
);
docket(
  "c08",
  "372",
  "2026-08-12",
  "Notice of Appearance",
  "NOTICE OF APPEARANCE filed by additional plaintiffs' counsel.",
  "notice",
);

// c09 Camp Lejeune
docket(
  "c09",
  "742",
  "2026-09-10",
  "Notice of Appearance (Defense)",
  "NOTICE OF APPEARANCE by defense counsel on behalf of the United States. No response deadline; informational only.",
  "notice",
  { name: "Notice of Appearance.pdf", tag: "notice", sizeLabel: "210 KB · 2 pages" },
);
docket(
  "c09",
  "701",
  "2026-08-21",
  "Order on Elective Option Litigation Track",
  "ORDER clarifying procedures for claimants electing the Elective Option settlement track.",
  "order",
);

// c10 Doe v. Acme Aviation
docket(
  "c10",
  "14",
  "2026-09-02",
  "Answer to Complaint",
  "ANSWER filed by Defendant Acme Aviation Corp., with affirmative defenses.",
  "filing",
  { name: "Answer to Complaint.pdf", tag: "order", sizeLabel: "310 KB · 11 pages" },
);
docket("c10", "6", "2026-08-05", "Summons Returned Executed", "SUMMONS returned executed as to Defendant.", "filing");

// c11 Ramirez v. Sterling
docket(
  "c11",
  "9",
  "2026-08-28",
  "Motion to Dismiss",
  "MOTION to dismiss for failure to state a claim filed by Defendant Sterling Pharmaceutical Inc.",
  "motion",
  { name: "Motion to Dismiss.pdf", tag: "motion", sizeLabel: "540 KB · 15 pages" },
);
docket("c11", "3", "2026-06-01", "Summons Issued", "SUMMONS issued as to Defendant.", "filing");

// c12 Torres v. BrightPath
docket(
  "c12",
  "5",
  "2026-07-30",
  "Notice of Removal",
  "NOTICE OF REMOVAL filed by Defendant BrightPath Diagnostics LLC, removing the action from state court.",
  "filing",
  { name: "Notice of Removal.pdf", tag: "notice", sizeLabel: "290 KB · 9 pages" },
);

// c13 ClearWave (JPML pending)
docket(
  "c13",
  "1",
  "2026-08-05",
  "Motion for Transfer and Coordination",
  "MOTION for transfer and coordination of related actions pursuant to 28 U.S.C. § 1407, filed with the Panel.",
  "motion",
  { name: "Motion for Transfer (Sec. 1407).pdf", tag: "motion", sizeLabel: "780 KB · 18 pages" },
);
docket("c13", "3", "2026-08-19", "Notice of Potential Tag-Along Actions", "NOTICE identifying potential tag-along actions for the proposed MDL.", "notice");

// c14 Nova Rideshare (JPML pending)
docket(
  "c14",
  "1",
  "2026-08-18",
  "Motion for Transfer and Coordination",
  "MOTION for transfer and coordination of related data-breach actions pursuant to 28 U.S.C. § 1407.",
  "motion",
  { name: "Motion for Transfer (Sec. 1407).pdf", tag: "motion", sizeLabel: "690 KB · 16 pages" },
);
docket("c14", "4", "2026-09-01", "Response in Support of Transfer", "RESPONSE filed in support of centralization, joined by six additional plaintiffs.", "filing");

// c15 Talc NJ MCL
docket(
  "c15",
  "2,204",
  "2026-09-11",
  "PSC Quarterly Status Report",
  "STATUS REPORT by the Plaintiffs' Steering Committee regarding the Q3 census and plaintiff fact sheet completion rates. Next status conference requested for Oct. 2, 2026.",
  "report",
  { name: "PSC Status Report — Q3 Census.pdf", tag: "report", sizeLabel: "820 KB · 12 pages" },
);
docket("c15", "2,166", "2026-08-11", "Case Management Order No. 22", "CASE MANAGEMENT ORDER NO. 22 addressing upcoming trial-pool discovery.", "cmo");

// c16 Accutane NJ MCL
docket(
  "c16",
  "1,180",
  "2026-09-09",
  "Order to Show Cause",
  "ORDER TO SHOW CAUSE re: plaintiff fact-sheet deficiencies. Written response required by Sept. 18, 2026; hearing on the OSC set for Sept. 25, 2026.",
  "order",
  { name: "Order to Show Cause.pdf", tag: "order", sizeLabel: "640 KB · 5 pages" },
);
docket("c16", "1,142", "2026-08-01", "Deficiency Schedule Filed", "NOTICE filing the updated plaintiff fact sheet deficiency schedule.", "notice");

// c17 Risperdal Phila CLC
docket(
  "c17",
  "88",
  "2026-08-27",
  "Settlement Administration Status Report",
  "REPORT on remaining claims-processing status under the master settlement agreement.",
  "report",
);
docket("c17", "81", "2026-07-15", "Order Closing Discovery Track", "ORDER closing the remaining discovery track for unresolved claims.", "order");

// c18 Roundup JCCP
docket(
  "c18",
  "612",
  "2026-09-03",
  "Case Management Order",
  "CASE MANAGEMENT ORDER coordinating trial settings with the federal MDL bellwether schedule.",
  "cmo",
  { name: "JCCP Case Management Order.pdf", tag: "cmo", sizeLabel: "710 KB · 9 pages" },
);
docket("c18", "579", "2026-08-06", "Notice of Coordination Conference", "NOTICE of coordination conference set with participating California superior courts.", "notice");

// c19 Zantac Delaware
docket(
  "c19",
  "204",
  "2026-08-14",
  "Order Staying Case Management Pending MDL Daubert Ruling",
  "ORDER staying further case management deadlines pending the federal MDL's ruling on general-causation Daubert motions.",
  "order",
  { name: "Order Staying Case Management.pdf", tag: "order", sizeLabel: "310 KB · 4 pages" },
);
docket("c19", "191", "2026-06-20", "Joint Status Letter", "LETTER jointly submitted by the parties regarding coordination with the federal MDL schedule.", "filing");

// c20 Chen v. Meridian
docket(
  "c20",
  "7",
  "2026-08-25",
  "Answer to Complaint",
  "ANSWER filed by Defendant Meridian Health Products, Inc.",
  "filing",
  { name: "Answer to Complaint.pdf", tag: "order", sizeLabel: "280 KB · 8 pages" },
);
docket("c20", "3", "2026-06-10", "Affidavit of Service", "AFFIDAVIT OF SERVICE filed as to Defendant.", "filing");

export const DOCKETS: DocketEntry[] = dockets;
export const FILES: FileRecord[] = files;

function reminder(kind: ReminderKind, opts: Partial<ReminderRule> = {}): ReminderRule {
  return { id: `r-${Math.random().toString(36).slice(2, 9)}`, kind, enabled: true, ...opts };
}

export const CALENDAR_EVENTS: CalendarEventRecord[] = [
  {
    id: "ev01",
    caseId: "c01",
    title: "Plaintiffs' expert reports due (CMO 14)",
    date: "2026-09-29",
    time: "17:00",
    type: "Filing deadline",
    reminders: [reminder("days_before", { daysBefore: 1 }), reminder("hours_before", { hoursBefore: 18 })],
    attendeeUserIds: ["u-mgarner", "u-ssiegal", "u-alipsky"],
    note: "General-causation expert disclosure deadline under CMO No. 14.",
    linkedDocketId: "dk001",
  },
  {
    id: "ev02",
    caseId: "c02",
    title: "Daubert response due",
    date: "2026-09-17",
    time: "17:00",
    type: "Filing deadline",
    reminders: [reminder("days_before", { daysBefore: 1 }), reminder("custom", { customUnit: "hours", customValue: 4 })],
    attendeeUserIds: ["u-mgarner", "u-dwhitfield", "u-alipsky"],
    note: "Response to Defendants' Daubert motion to exclude general-causation experts.",
    linkedDocketId: "dk003",
  },
  {
    id: "ev03",
    caseId: "c03",
    title: "Case management conference",
    date: "2026-09-22",
    time: "10:00",
    type: "Case management conf.",
    reminders: [reminder("days_before", { daysBefore: 1 }), reminder("same_day_time", { time: "08:00" })],
    attendeeUserIds: ["u-mgarner", "u-pnandakumar", "u-alipsky"],
    linkedDocketId: "dk005",
  },
  {
    id: "ev04",
    caseId: "c16",
    title: "OSC response — fact sheet deficiencies",
    date: "2026-09-18",
    time: "17:00",
    type: "Filing deadline",
    reminders: [reminder("days_before", { daysBefore: 1 }), reminder("hours_before", { hoursBefore: 18 })],
    attendeeUserIds: ["u-mgarner", "u-ssiegal"],
    linkedDocketId: "dk030",
  },
  {
    id: "ev05",
    caseId: "c16",
    title: "OSC hearing",
    date: "2026-09-25",
    time: "09:30",
    type: "Hearing",
    reminders: [reminder("days_before", { daysBefore: 1 })],
    attendeeUserIds: ["u-mgarner", "u-ssiegal", "u-alipsky"],
    linkedDocketId: "dk030",
  },
  {
    id: "ev06",
    caseId: "c15",
    title: "PSC status conference",
    date: "2026-10-02",
    time: "09:00",
    type: "Case management conf.",
    reminders: [reminder("days_before", { daysBefore: 1 })],
    attendeeUserIds: ["u-mgarner", "u-ssiegal"],
    linkedDocketId: "dk028",
  },
  {
    id: "ev07",
    caseId: "c05",
    title: "Response to order on motion to dismiss — internal review",
    date: "2026-09-16",
    time: "12:00",
    type: "Internal review",
    reminders: [reminder("same_day_time", { time: "08:30" })],
    attendeeUserIds: ["u-pnandakumar", "u-dwhitfield"],
    linkedDocketId: "dk009",
  },
  {
    id: "ev08",
    caseId: "c07",
    title: "Bellwether wave conference",
    date: "2026-09-24",
    time: "13:00",
    type: "Hearing",
    reminders: [reminder("days_before", { daysBefore: 1 }), reminder("hours_before", { hoursBefore: 18 })],
    attendeeUserIds: ["u-mgarner", "u-ssiegal", "u-alipsky"],
    linkedDocketId: "dk013",
  },
  {
    id: "ev09",
    caseId: "c08",
    title: "Initial case management conference",
    date: "2026-09-19",
    time: "10:30",
    type: "Case management conf.",
    reminders: [reminder("days_before", { daysBefore: 1 })],
    attendeeUserIds: ["u-mgarner", "u-pnandakumar"],
    linkedDocketId: "dk015",
  },
  {
    id: "ev10",
    caseId: "c18",
    title: "Coordination conference",
    date: "2026-09-21",
    time: "09:00",
    type: "Case management conf.",
    reminders: [reminder("days_before", { daysBefore: 1 })],
    attendeeUserIds: ["u-mgarner", "u-pnandakumar"],
    linkedDocketId: "dk035",
  },
  {
    id: "ev11",
    caseId: "c11",
    title: "Motion to dismiss — opposition due",
    date: "2026-09-25",
    time: "17:00",
    type: "Filing deadline",
    reminders: [reminder("days_before", { daysBefore: 1 }), reminder("hours_before", { hoursBefore: 18 })],
    attendeeUserIds: ["u-mgarner", "u-dwhitfield"],
    linkedDocketId: "dk021",
  },
  {
    id: "ev12",
    caseId: "c04",
    title: "Claims administrator report — internal review",
    date: "2026-09-15",
    time: "11:00",
    type: "Internal review",
    reminders: [reminder("same_day_time", { time: "08:00" })],
    attendeeUserIds: ["u-ssiegal", "u-alipsky"],
    linkedDocketId: "dk008",
  },
];

const seedDeadline = (
  id: string,
  caseId: string,
  ruleId: string,
  triggerDate: string,
  label: string,
  status: TriggeredDeadline["status"],
  calendarEventId?: string,
): TriggeredDeadline => {
  const rule = ruleById(ruleId)!;
  return {
    id,
    caseId,
    ruleId,
    triggerDate,
    computedDate: computeDeadlineDate(triggerDate, rule),
    label,
    status,
    calendarEventId,
  };
};

export const TRIGGERED_DEADLINES: TriggeredDeadline[] = [
  seedDeadline("td01", "c10", "frcp-12a1Ai", "2026-08-05", "Answer due — Doe v. Acme Aviation", "calendared"),
  seedDeadline("td02", "c11", "frcp-12a1Ai", "2026-06-01", "Answer/response due — Ramirez v. Sterling", "calendared", "ev11"),
  seedDeadline("td03", "c20", "ny-3012a", "2026-06-10", "Answer due — Chen v. Meridian Health", "past"),
  seedDeadline("td04", "c13", "jpml-6.2b", "2026-08-19", "Opposition to CTO due — ClearWave", "upcoming"),
  seedDeadline("td05", "c14", "jpml-6.2e", "2026-09-01", "Motion to vacate CTO due — Nova Rideshare", "upcoming"),
  seedDeadline("td06", "c12", "removal-1446b", "2026-07-01", "Removal deadline — Torres v. BrightPath", "past"),
  seedDeadline("td07", "c15", "nj-46-1", "2026-08-11", "Responsive filing window — Talc NJ MCL", "upcoming"),
];
