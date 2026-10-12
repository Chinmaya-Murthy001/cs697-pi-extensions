import { test } from "node:test";
import assert from "node:assert/strict";
import { askUser, CUSTOM_ANSWER_LABEL, formatResultForModel } from "../../extensions/ask-user/interaction.ts";
import { fakeUI, sampleInput } from "./fakes.ts";

test("shows the question, the reason, every option with its tradeoff, and the recommendation", async () => {
  const { ui, calls } = fakeUI([undefined]);
  await askUser(sampleInput, ui);
  const { title, options } = calls[0];
  assert.match(title, /persist after Pi restarts/);
  assert.match(title, /writes? state to disk|write state to disk/);
  assert.equal(options!.length, 3, "two options + custom answer");
  assert.match(options![0], /Session only.*Simpler/);
  assert.match(options![0], /recommended/i);
  assert.match(options![1], /Persist on disk.*file I\/O/);
  assert.doesNotMatch(options![1], /recommended/i);
  assert.equal(options![2], CUSTOM_ANSWER_LABEL);
});

test("selecting an option returns answered with that exact option label", async () => {
  const { ui } = fakeUI([undefined]);
  // pick the second displayed option
  ui.select = async (_t: string, opts: string[]) => opts[1];
  const r = await askUser(sampleInput, ui);
  assert.deepEqual(r, { status: "answered", source: "option", answer: "Persist on disk", option: "Persist on disk" });
});

test("selecting an option that contradicts the recommendation is preserved, not overridden", async () => {
  const { ui } = fakeUI([]);
  ui.select = async (_t: string, opts: string[]) => opts[1];
  const r = await askUser(sampleInput, ui);
  assert.equal(r.status, "answered");
  assert.equal(r.status === "answered" && r.answer, "Persist on disk");
});

test("a custom answer is returned exactly (trimmed)", async () => {
  const { ui, calls } = fakeUI([CUSTOM_ANSWER_LABEL, "  Persist, but only for 24 hours  "]);
  const r = await askUser(sampleInput, ui);
  assert.deepEqual(r, { status: "answered", source: "custom", answer: "Persist, but only for 24 hours" });
  assert.equal(calls[1].kind, "input");
});

test("dismissing the selector returns cancelled and never picks a default", async () => {
  const { ui } = fakeUI([undefined]);
  const r = await askUser(sampleInput, ui);
  assert.deepEqual(r, { status: "cancelled", reason: "dismissed" });
});

test("dismissing the custom-answer input returns cancelled", async () => {
  const { ui } = fakeUI([CUSTOM_ANSWER_LABEL, undefined]);
  const r = await askUser(sampleInput, ui);
  assert.deepEqual(r, { status: "cancelled", reason: "dismissed" });
});

test("an empty custom answer returns cancelled (empty_answer), not consent", async () => {
  const { ui } = fakeUI([CUSTOM_ANSWER_LABEL, "   "]);
  const r = await askUser(sampleInput, ui);
  assert.deepEqual(r, { status: "cancelled", reason: "empty_answer" });
});

test("no UI returns unavailable without opening any dialog", async () => {
  const r = await askUser(sampleInput, undefined);
  assert.deepEqual(r, { status: "unavailable", reason: "no_interactive_ui" });
});

test("invalid input returns invalid without opening any dialog", async () => {
  const { ui, calls } = fakeUI([]);
  const r = await askUser({ ...sampleInput, options: [] }, ui);
  assert.equal(r.status, "invalid");
  assert.equal(calls.length, 0);
});

test("model-facing text states each outcome explicitly", () => {
  assert.match(formatResultForModel({ status: "answered", source: "option", answer: "Session only", option: "Session only" }), /answered.*Session only/i);
  assert.match(formatResultForModel({ status: "answered", source: "custom", answer: "24h only" }), /custom.*24h only/i);
  const c = formatResultForModel({ status: "cancelled", reason: "dismissed" });
  assert.match(c, /cancel/i);
  assert.match(c, /do not assume|not.*choose/i);
  const u = formatResultForModel({ status: "unavailable", reason: "no_interactive_ui" });
  assert.match(u, /unavailable/i);
  assert.match(u, /do not assume|not.*choose/i);
});
