import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAskUserInput } from "../../extensions/ask-user/contract.ts";
import { sampleInput } from "./fakes.ts";

test("accepts a valid question with 2 options and a recommendation", () => {
  const r = validateAskUserInput(sampleInput);
  assert.equal(r.ok, true);
});

test("accepts 3 options and no recommendation", () => {
  const r = validateAskUserInput({
    ...sampleInput,
    recommendation: undefined,
    options: [...sampleInput.options, { label: "Ask each time", tradeoff: "Most control; more prompts" }],
  });
  assert.equal(r.ok, true);
});

const bad: [string, unknown][] = [
  ["empty question", { ...sampleInput, question: "  " }],
  ["missing reason", { ...sampleInput, reason: "" }],
  ["only one option", { ...sampleInput, options: [sampleInput.options[0]] }],
  ["four options", { ...sampleInput, options: [1, 2, 3, 4].map((n) => ({ label: `O${n}`, tradeoff: "t" })) }],
  ["duplicate labels", { ...sampleInput, recommendation: undefined, options: [{ label: "A", tradeoff: "x" }, { label: "a ", tradeoff: "y" }] }],
  ["empty tradeoff", { ...sampleInput, options: [{ label: "A", tradeoff: "" }, { label: "B", tradeoff: "y" }], recommendation: undefined }],
  ["recommendation not an option", { ...sampleInput, recommendation: "Something else" }],
];
for (const [name, input] of bad) {
  test(`rejects invalid input: ${name}`, () => {
    const r = validateAskUserInput(input);
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.error.length > 0);
  });
}
