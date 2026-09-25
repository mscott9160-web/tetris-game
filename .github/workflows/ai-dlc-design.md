---
description: Reviews an approved work item and proposes an implementation design.
on:
  issues:
    types: [labeled]
  roles: all
if: contains(github.event.issue.labels.*.name, 'design-request')
permissions:
  contents: read
  issues: read
engine:
  id: copilot
  model: auto
max-turns: 10
safe-outputs:
  add-comment:
    max: 1
timeout-minutes: 8
---
# Design assistant

Read the issue, comments, repository structure, architecture documentation, and relevant tests. Do not modify files.

Propose one recommended design, alternatives considered, interfaces or data changes, risks, rollout considerations, and a focused test strategy. Cite repository evidence. Post one comment under 350 words with approval status `Pending maintainer review`. Do not treat the proposal as approval to implement.
