// Fake dialog UI: scripted responses, records every call.
export type Step = { select?: string | undefined } | { input?: string | undefined };

export function fakeUI(script: Array<string | undefined>) {
  const calls: { kind: "select" | "input"; title: string; options?: string[] }[] = [];
  const queue = [...script];
  const ui = {
    async select(title: string, options: string[]) {
      calls.push({ kind: "select", title, options });
      return queue.shift();
    },
    async input(title: string) {
      calls.push({ kind: "input", title });
      return queue.shift();
    },
  };
  return { ui, calls };
}

export const sampleInput = {
  question: "Should reminders persist after Pi restarts?",
  reason: "It decides whether we write state to disk, which changes scope and testing.",
  options: [
    { label: "Session only", tradeoff: "Simpler; may remind again after a restart" },
    { label: "Persist on disk", tradeoff: "No repeat after restart; needs file I/O and more tests" },
  ],
  recommendation: "Session only",
};
