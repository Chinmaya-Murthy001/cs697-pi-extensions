import { test } from "node:test";
import assert from "node:assert/strict";
import askUserExtension from "../../extensions/ask-user/index.ts";
import { CUSTOM_ANSWER_LABEL } from "../../extensions/ask-user/interaction.ts";
import { fakeUI, sampleInput } from "./fakes.ts";

type Tool = {
  name: string;
  description: string;
  promptGuidelines?: string[];
  parameters: { properties?: Record<string, unknown> };
  execute: (id: string, params: unknown, signal: AbortSignal | undefined, onUpdate: unknown, ctx: unknown) => Promise<{ content: { type: string; text: string }[]; details: any }>;
};

function load() {
  const tools: Tool[] = [];
  askUserExtension({ registerTool: (t: Tool) => tools.push(t) } as never);
  assert.equal(tools.length, 1);
  return tools[0];
}

test("registers a model-callable ask_user tool with a schema and asking guidelines", () => {
  const tool = load();
  assert.equal(tool.name, "ask_user");
  for (const key of ["question", "reason", "options", "recommendation"]) assert.ok(tool.parameters.properties?.[key], key);
  assert.ok(tool.promptGuidelines && tool.promptGuidelines.length > 0);
  assert.match(tool.promptGuidelines!.join(" "), /proceed/i);
});

test("execute returns the selected answer to the model", async () => {
  const tool = load();
  const { ui } = fakeUI([]);
  ui.select = async (_t: string, o: string[]) => o[0];
  const res = await tool.execute("1", sampleInput, undefined, undefined, { hasUI: true, ui });
  assert.equal(res.details.status, "answered");
  assert.equal(res.details.answer, "Session only");
  assert.match(res.content[0].text, /Session only/);
});

test("execute returns a custom answer to the model", async () => {
  const tool = load();
  const { ui } = fakeUI([CUSTOM_ANSWER_LABEL, "Use a config flag, default off"]);
  const res = await tool.execute("2", sampleInput, undefined, undefined, { hasUI: true, ui });
  assert.equal(res.details.answer, "Use a config flag, default off");
});

test("execute reports unavailable when ctx.hasUI is false and never touches the UI", async () => {
  const tool = load();
  const { ui, calls } = fakeUI(["Session only"]);
  const res = await tool.execute("3", sampleInput, undefined, undefined, { hasUI: false, ui });
  assert.equal(res.details.status, "unavailable");
  assert.equal(calls.length, 0);
});

test("execute reports cancellation", async () => {
  const tool = load();
  const { ui } = fakeUI([undefined]);
  const res = await tool.execute("4", sampleInput, undefined, undefined, { hasUI: true, ui });
  assert.equal(res.details.status, "cancelled");
  assert.match(res.content[0].text, /cancel/i);
});
