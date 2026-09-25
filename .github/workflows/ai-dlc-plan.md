---
description: Clarifies new work items and recommends bounded planning metadata.
on:
  issues:
    types: [opened, reopened]
  roles: all
permissions:
  contents: read
  issues: read
engine:
  id: copilot
  model: auto
max-turns: 10
safe-outputs:
  add-labels:
    allowed: [bug, feature, needs-info, priority/p0, priority/p1, priority/p2]
    max: 3
  add-comment:
    max: 1
timeout-minutes: 8
---
# Planning assistant

Read the issue, comments, issue templates, contribution guidance, and relevant documentation.

Assess whether the request contains a clear problem, desired outcome, scope, and acceptance criteria. For bugs, look for reproduction steps, expected and actual behavior, environment, and errors. Ask focused questions when required evidence is missing. Do not guess priority.

Post one comment under 250 words with a summary, evidence, acceptance criteria, open questions, priority or unset, and status `Pending maintainer review`. Never close, assign, or approve the issue.
