// Ask the Human — Pi extension entry point.
// Load with: pi --extension ./extensions/ask-user/index.ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { askUser, formatResultForModel } from "./interaction.ts";

const AskUserParams = Type.Object({
  question: Type.String({ description: "One clear question for the user" }),
  reason: Type.String({ description: "Briefly, why this choice matters (behavior, scope or rework)" }),
  options: Type.Array(
    Type.Object({
      label: Type.String({ description: "Short option name" }),
      tradeoff: Type.String({ description: "The main tradeoff of this option" }),
    }),
    { minItems: 2, maxItems: 3, description: "Two or three options with tradeoffs" },
  ),
  recommendation: Type.Optional(Type.String({ description: "Optional: the label of the option you recommend" })),
});

export default function askUserExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "ask_user",
    label: "Ask user",
    description:
      "Ask the human user ONE important unresolved decision and wait for their answer. Provide the question, " +
      "why it matters, 2-3 options with tradeoffs, and optionally a recommended option. The user can pick an " +
      "option or write their own answer. Returns answered, cancelled, or unavailable.",
    promptSnippet: "ask_user: ask the human one important unresolved decision (2-3 options with tradeoffs)",
    promptGuidelines: [
      "Use ask_user when an unresolved choice materially changes user-visible behavior, scope, or the amount of rework, and the user has not already decided it.",
      "Proceed without asking when the requirement is explicit, the user delegated the choice to you, or the detail is routine and reversible (names, formatting, file layout).",
      "Ask one question at a time; give 2-3 options with honest tradeoffs and a recommendation when you have one.",
      "If ask_user returns cancelled or unavailable, do not invent an answer: say the decision is still open and only continue with work that does not depend on it.",
      "After an answer, follow it exactly, even if it differs from your recommendation.",
    ],
    parameters: AskUserParams,
    executionMode: "sequential",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const ui = ctx.hasUI ? ctx.ui : undefined;
      const result = await askUser(params, ui, signal);
      return { content: [{ type: "text", text: formatResultForModel(result) }], details: result };
    },
  });
}
