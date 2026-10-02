// W1-4 red: clock stub.
export function createClock(_env: unknown, _realNow?: () => number): () => Date {
  return () => new Date(0);
}
