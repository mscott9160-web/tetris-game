---
description: Prepares release notes and a human-reviewed deployment recommendation.
on:
  workflow_dispatch:
  issues:
    types: [labeled]
  roles: all
if: contains(github.event.issue.labels.*.name, 'release-candidate') || github.event_name == 'workflow_dispatch'
permissions:
  contents: read
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
# Release assistant

Read merged changes since the last release, release metadata, validation results, migration notes, and deployment documentation. Do not create a release, publish artifacts, deploy, or change production configuration.

Post release notes, a risk summary, validation gaps, rollback considerations, and a go/no-go recommendation. Mark the recommendation `Pending maintainer approval`.
