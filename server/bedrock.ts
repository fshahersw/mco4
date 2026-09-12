import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const REGION = process.env.AWS_REGION || "us-east-1";
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6";

const client = new BedrockRuntimeClient({
  region: REGION,
  maxAttempts: 5,
  retryMode: "adaptive",
});

export interface DraftRequest {
  eventTitle: string;
  eventType: string;
  caseName: string;
  dueDate: string;
  dueTime?: string;
  recipients: string[];
  notes?: string;
}

export class BedrockCredentialsError extends Error {}

const SYSTEM_PROMPT = [
  "You draft short, professional internal reminder-email bodies for a law firm's litigation docket team.",
  "Write 2-4 plain-text sentences. No subject line, no greeting boilerplate beyond a brief salutation, no signature block.",
  "Be specific about the deadline, the case, and what action is needed. Neutral, professional tone. Do not invent facts beyond what is given.",
].join(" ");

export async function draftReminderMessage(req: DraftRequest): Promise<string> {
  const userText = [
    `Case: ${req.caseName}`,
    `Event: ${req.eventTitle} (${req.eventType})`,
    `Due: ${req.dueDate}${req.dueTime ? " at " + req.dueTime : ""}`,
    req.notes ? `Context: ${req.notes}` : "",
    `Recipients: ${req.recipients.join(", ") || "case team"}`,
    "",
    "Draft the reminder email body now.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: SYSTEM_PROMPT }],
        messages: [{ role: "user", content: [{ text: userText }] }],
        inferenceConfig: { maxTokens: 400, temperature: 0.4 },
      }),
    );
    const text = response.output?.message?.content?.[0]?.text;
    if (!text) throw new Error("Bedrock returned an empty response.");
    return text.trim();
  } catch (err) {
    const name = (err as { name?: string } | undefined)?.name ?? "";
    if (
      name.includes("CredentialsProviderError") ||
      name.includes("ExpiredToken") ||
      name.includes("UnrecognizedClientException") ||
      name === "AccessDeniedException"
    ) {
      throw new BedrockCredentialsError(
        "AWS credentials are missing or expired for the configured SSO profile. Run `aws sso login` and retry — this app does not fall back to a static key.",
      );
    }
    throw err;
  }
}
