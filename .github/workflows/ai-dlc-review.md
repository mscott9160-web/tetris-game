---
description: Reviews pull requests for evidence-based defects and missing validation.
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
  pull-requests: read
engine:
  id: copilot
  model: auto
max-turns: 12
safe-outputs:
  add-comment:
    max: 1
timeout-minutes: 8
---
# Pull request review assistant

Read the pull request diff, changed tests, repository guidance, and relevant source. Prioritize correctness, security, data loss, regressions, and missing tests. Ignore style preferences unless they affect maintainability or project conventions.

Post one review summary under 300 words. Findings must include severity, file and symbol, evidence, and a focused fix. If no evidence supports a finding, do not invent one. A human maintainer decides whether to merge.
