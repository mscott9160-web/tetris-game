---
description: Reviews implementation requests and reports whether a proposed change is ready for human coding or pull request work.
on:
  issues:
    types: [labeled]
  roles: all
if: contains(github.event.issue.labels.*.name, 'implementation-request')
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
# Implementation assistant

Read the approved issue, design discussion, repository conventions, and existing tests. Do not push commits or modify the default branch.

Produce an implementation checklist covering files, behavior, tests, migration concerns, and unresolved questions. Identify the smallest safe pull request. Post one comment under 300 words with status `Pending maintainer review`.
