// Presents one question with Pi's built-in select/input dialogs and maps the
// human's response to an explicit result. The UI is injected so tests can fake it.
import { validateAskUserInput } from "./contract.ts";
import type { AskUserResult } from "./contract.ts";

export const CUSTOM_ANSWER_LABEL = "✎ Write my own answer…";

export interface DialogUI {
  select(title: string, options: string[], opts?: { signal?: AbortSignal }): Promise<string | undefined>;
  input(title: string, placeholder?: string, opts?: { signal?: AbortSignal }): Promise<string | undefined>;
}

export async function askUser(input: unknown, ui: DialogUI | undefined, signal?: AbortSignal): Promise<AskUserResult> {
  const checked = validateAskUserInput(input);
  if (!checked.ok) return { status: "invalid", error: checked.error };
  if (!ui) return { status: "unavailable", reason: "no_interactive_ui" };

  const { question, reason, options, recommendation } = checked.value;
  const title = `${question}\n\nWhy it matters: ${reason}`;
  const labels = options.map(
    (o) => `${o.label} — ${o.tradeoff}${o.label === recommendation ? "  (recommended)" : ""}`,
  );

  const picked = await ui.select(title, [...labels, CUSTOM_ANSWER_LABEL], { signal });
  if (picked === undefined) return { status: "cancelled", reason: "dismissed" };

  if (picked === CUSTOM_ANSWER_LABEL) {
    const written = await ui.input(`${question}\n\nYour answer:`, "Type your answer", { signal });
    if (written === undefined) return { status: "cancelled", reason: "dismissed" };
    const answer = written.trim();
    if (answer.length === 0) return { status: "cancelled", reason: "empty_answer" };
    return { status: "answered", source: "custom", answer };
  }

  const index = labels.indexOf(picked);
  if (index === -1) return { status: "cancelled", reason: "dismissed" }; // unknown value: never guess
  const option = options[index].label;
  return { status: "answered", source: "option", answer: option, option };
}

const NO_ANSWER =
  "Do not assume or choose an answer on the user's behalf. Tell the user this decision is still open, " +
  "and only continue with work that does not depend on it.";

export function formatResultForModel(result: AskUserResult): string {
  switch (result.status) {
    case "answered":
      return result.source === "option"
        ? `The user answered by selecting the option "${result.option}". Use this answer: ${result.answer}`
        : `The user answered with a custom answer. Use this answer exactly: ${result.answer}`;
    case "cancelled":
      return result.reason === "empty_answer"
        ? `No answer: the user cancelled by submitting an empty answer. ${NO_ANSWER}`
        : `No answer: the user cancelled the question. ${NO_ANSWER}`;
    case "unavailable":
      return `No answer: interactive UI is unavailable, so the user could not be asked. ${NO_ANSWER}`;
    case "invalid":
      return `ask_user was not shown because the input was invalid: ${result.error}. Fix the call and try again.`;
  }
}
