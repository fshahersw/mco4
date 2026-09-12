import express from "express";
import {
  CASES,
  USERS,
  ASSIGNMENTS,
  DOCKETS,
  FILES,
  CALENDAR_EVENTS,
  TRIGGERED_DEADLINES,
} from "../shared/mockData";
import { JURISDICTION_RULES, ruleById } from "../shared/rules/jurisdictions";
import { computeDeadlineDate } from "../shared/rules/engine";
import type { AssignmentRecord, CalendarEventRecord, TriggeredDeadline, UserRecord } from "../shared/types";
import { draftReminderMessage, BedrockCredentialsError } from "./bedrock";

const app = express();
app.use(express.json());

// In-memory mutable state seeded from the mock dataset. Resets on server restart —
// and, on Vercel, on each new serverless instance — since this prototype has no
// database; DocketBird/CourtListener are not called live yet.
const state = {
  users: [...USERS] as UserRecord[],
  assignments: [...ASSIGNMENTS] as AssignmentRecord[],
  events: [...CALENDAR_EVENTS] as CalendarEventRecord[],
  deadlines: [...TRIGGERED_DEADLINES] as TriggeredDeadline[],
};

let idSeq = 1000;
const nextId = (prefix: string) => `${prefix}-${idSeq++}`;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    docketbirdConfigured: Boolean(process.env.DOCKETBIRD_API_KEY),
    courtlistenerConfigured: Boolean(process.env.COURTLISTENER_API_KEY),
    bedrockRegion: process.env.AWS_REGION || "us-east-1",
    bedrockModelId: process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6",
  });
});

app.get("/api/cases", (_req, res) => res.json(CASES));
app.get("/api/dockets", (_req, res) => res.json(DOCKETS));
app.get("/api/files", (_req, res) => res.json(FILES));
app.get("/api/rules", (_req, res) => res.json(JURISDICTION_RULES));

app.get("/api/users", (_req, res) => res.json(state.users));
app.post("/api/users", (req, res) => {
  const { name, email, role, title } = req.body ?? {};
  if (!name || !email || !role) {
    return res.status(400).json({ error: "name, email, and role are required." });
  }
  const user: UserRecord = {
    id: nextId("u"),
    name,
    email,
    role,
    title,
    status: "invited",
    createdDate: new Date().toISOString().slice(0, 10),
  };
  state.users.push(user);
  res.status(201).json(user);
});

app.get("/api/assignments", (_req, res) => res.json(state.assignments));
app.post("/api/assignments", (req, res) => {
  const { caseId, userId, teamRole } = req.body ?? {};
  if (!caseId || !userId || !teamRole) {
    return res.status(400).json({ error: "caseId, userId, and teamRole are required." });
  }
  const assignment: AssignmentRecord = { id: nextId("a"), caseId, userId, teamRole };
  state.assignments.push(assignment);
  res.status(201).json(assignment);
});
app.delete("/api/assignments/:id", (req, res) => {
  state.assignments = state.assignments.filter((a) => a.id !== req.params.id);
  res.status(204).end();
});

app.get("/api/calendar-events", (_req, res) => res.json(state.events));
app.post("/api/calendar-events", (req, res) => {
  const body = req.body ?? {};
  if (!body.caseId || !body.title || !body.date || !body.time || !body.type) {
    return res.status(400).json({ error: "caseId, title, date, time, and type are required." });
  }
  const event: CalendarEventRecord = {
    id: nextId("ev"),
    caseId: body.caseId,
    title: body.title,
    date: body.date,
    time: body.time,
    type: body.type,
    reminders: body.reminders ?? [],
    attendeeUserIds: body.attendeeUserIds ?? [],
    note: body.note,
    draftedMessage: body.draftedMessage,
    linkedDocketId: body.linkedDocketId,
  };
  state.events.push(event);
  res.status(201).json(event);
});
app.patch("/api/calendar-events/:id", (req, res) => {
  const idx = state.events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Event not found." });
  state.events[idx] = { ...state.events[idx], ...req.body };
  res.json(state.events[idx]);
});

app.get("/api/deadlines", (_req, res) => res.json(state.deadlines));

app.post("/api/deadlines/compute", (req, res) => {
  const { ruleId, triggerDate } = req.body ?? {};
  const rule = ruleById(ruleId);
  if (!rule) return res.status(400).json({ error: "Unknown ruleId." });
  if (!triggerDate) return res.status(400).json({ error: "triggerDate is required." });
  res.json({ computedDate: computeDeadlineDate(triggerDate, rule) });
});

app.post("/api/deadlines", (req, res) => {
  const { caseId, ruleId, triggerDate, label } = req.body ?? {};
  const rule = ruleById(ruleId);
  if (!caseId || !rule || !triggerDate || !label) {
    return res.status(400).json({ error: "caseId, ruleId, triggerDate, and label are required." });
  }
  const deadline: TriggeredDeadline = {
    id: nextId("td"),
    caseId,
    ruleId,
    triggerDate,
    computedDate: computeDeadlineDate(triggerDate, rule),
    label,
    status: "upcoming",
  };
  state.deadlines.push(deadline);
  res.status(201).json(deadline);
});

app.patch("/api/deadlines/:id", (req, res) => {
  const idx = state.deadlines.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Deadline not found." });
  state.deadlines[idx] = { ...state.deadlines[idx], ...req.body };
  res.json(state.deadlines[idx]);
});

app.post("/api/draft", async (req, res) => {
  const { eventTitle, eventType, caseName, dueDate, dueTime, recipients, notes } = req.body ?? {};
  if (!eventTitle || !eventType || !caseName || !dueDate) {
    return res.status(400).json({ error: "eventTitle, eventType, caseName, and dueDate are required." });
  }
  try {
    const draft = await draftReminderMessage({
      eventTitle,
      eventType,
      caseName,
      dueDate,
      dueTime,
      recipients: recipients ?? [],
      notes,
    });
    res.json({ draft });
  } catch (err) {
    if (err instanceof BedrockCredentialsError) {
      return res.status(503).json({ error: err.message, code: "BEDROCK_CREDENTIALS" });
    }
    console.error("[/api/draft]", err);
    res.status(502).json({ error: "Bedrock request failed. See server logs for details." });
  }
});

export default app;
