---
description: Summarizes failed validation and proposes a focused next step.
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
permissions:
  contents: read
  actions: read
  issues: read
engine:
  id: copilot
  model: auto
max-turns: 8
safe-outputs:
  add-comment:
    max: 1
timeout-minutes: 8
---
# Validation assistant

Run only when the workflow conclusion is failure. Read the failed job logs, changed files, test configuration, and repository guidance. Do not rerun jobs or modify code.

Post one concise summary with the failing check, evidence, likely cause, confidence, and one focused next step. Do not claim a fix without a passing validation result.
