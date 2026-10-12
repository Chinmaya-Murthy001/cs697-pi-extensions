#!/usr/bin/env bash
# W2 demo (bash/macOS): passing tests, then a live Pi session where the agent must ask.
set -e
repo="$(cd "$(dirname "$0")/.." && pwd)"; cd "$repo"
echo; echo "== 1) Tests =="
node --test "tests/ask-user/*.test.ts" 2>&1 | grep -E '^(ok|# (tests|pass|fail))'
echo; echo "== 2) Live agent: a task with an unresolved choice =="
mkdir -p demo-sandbox && rm -rf demo-sandbox/* && cd demo-sandbox
pi --no-session --no-context-files -e "$repo/extensions/ask-user/index.ts" \
  "Create a small config file for my midnight reminder with two settings: the reminder message and the quiet hours (00:00 to 06:00). I haven't decided between JSON and YAML yet, and people will edit it by hand. Only create that one file in the current folder, then show me its contents."
