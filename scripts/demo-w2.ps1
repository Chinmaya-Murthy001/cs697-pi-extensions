# W2 demo (Windows PowerShell): passing tests, then a live Pi session where the agent must ask.
# Run from the repository root:  powershell -ExecutionPolicy Bypass -File scripts\demo-w2.ps1
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

Write-Host "`n== 1) Tests ==" -ForegroundColor Cyan
node --test "tests/ask-user/*.test.ts" 2>&1 | Select-String -Pattern '^(ok|# (tests|pass|fail))'

Write-Host "`n== 2) Live agent: a task with an unresolved choice ==" -ForegroundColor Cyan
$sandbox = Join-Path $repo "demo-sandbox"
New-Item -ItemType Directory -Force -Path $sandbox | Out-Null
Get-ChildItem $sandbox -Force | Remove-Item -Recurse -Force
Set-Location $sandbox
$prompt = "Create a small config file for my midnight reminder with two settings: the reminder message and the quiet hours (00:00 to 06:00). I haven't decided between JSON and YAML yet, and people will edit it by hand. Only create that one file in the current folder, then show me its contents."
pi --no-session --no-context-files -e (Join-Path $repo "extensions/ask-user/index.ts") $prompt
Set-Location $repo
