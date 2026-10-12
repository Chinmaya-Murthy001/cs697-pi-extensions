// ask_user tool contract: input shape, result shape, and validation (no Pi, no UI).

export interface AskUserOption {
  label: string;
  tradeoff: string;
}

export interface AskUserInput {
  question: string;
  reason: string;
  options: AskUserOption[];
  recommendation?: string;
}

export type AskUserResult =
  | { status: "answered"; source: "option"; answer: string; option: string }
  | { status: "answered"; source: "custom"; answer: string }
  | { status: "cancelled"; reason: "dismissed" | "empty_answer" }
  | { status: "unavailable"; reason: "no_interactive_ui" }
  | { status: "invalid"; error: string };

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 3;

const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function validateAskUserInput(
  input: unknown,
): { ok: true; value: AskUserInput } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (typeof input !== "object" || input === null) return fail("input must be an object");
  const { question, reason, options, recommendation } = input as Record<string, unknown>;

  if (!isText(question)) return fail("question must be a non-empty string");
  if (!isText(reason)) return fail("reason must be a non-empty string explaining why the choice matters");
  if (!Array.isArray(options) || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    return fail(`options must contain ${MIN_OPTIONS} or ${MAX_OPTIONS} items`);
  }

  const clean: AskUserOption[] = [];
  const seen = new Set<string>();
  for (const [i, o] of options.entries()) {
    const { label, tradeoff } = (o ?? {}) as Record<string, unknown>;
    if (!isText(label)) return fail(`options[${i}].label must be a non-empty string`);
    if (!isText(tradeoff)) return fail(`options[${i}].tradeoff must be a non-empty string`);
    const key = label.trim().toLowerCase();
    if (seen.has(key)) return fail(`option labels must be unique ("${label.trim()}" repeats)`);
    seen.add(key);
    clean.push({ label: label.trim(), tradeoff: tradeoff.trim() });
  }

  let rec: string | undefined;
  if (recommendation !== undefined && recommendation !== null && recommendation !== "") {
    if (!isText(recommendation)) return fail("recommendation must be a string");
    rec = clean.find((o) => o.label.toLowerCase() === recommendation.trim().toLowerCase())?.label;
    if (!rec) return fail("recommendation must match one of the option labels");
  }

  return {
    ok: true,
    value: { question: question.trim(), reason: reason.trim(), options: clean, ...(rec ? { recommendation: rec } : {}) },
  };
}
