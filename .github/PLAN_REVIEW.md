# Contributor action-plan review

This repository has a GitHub Actions workflow that replies when a collaborator posts or edits an issue comment starting with `/request-plan` on its own first line. Copy the structure from [ACTION_PLAN_TEMPLATE.md](ACTION_PLAN_TEMPLATE.md). This workflow is rules-based, not AI; it requires no API keys, paid model service, PAT, custom secret, or new npm dependency.

## Enable

Commit the `.github` automation files to the repository's default branch. GitHub Actions must be enabled, and organization policy must permit this workflow to use `contents: read` and `issues: write`. GitHub supplies `GITHUB_TOKEN` automatically. Workflow files on another branch do not activate the issue-comment trigger. Standard Actions runner quotas and billing still apply, especially for private repositories.

The reviewer is configured as `Kunchana-Wijesinghe` in `plan-review-config.json`. Each repository has its own validation commands there. Only repository collaborators, organization members and owners can trigger replies; unrelated comments, bots, closed issues and pull-request comments are ignored.

## What it checks

- An issue summary names the actual issue's title/objective terms.
- Implementation, integration and verification steps are provided. A Proposed Solution section is recognized and checked when present; legacy plans without it remain compatible.
- Every checkbox under the issue's Acceptance Criteria heading has one `AC1: ...`, `AC2: ...` explanation, in order, containing relevant terms from that criterion. Both plain and bold AC labels are supported, and explanations may span multiple lines. All criteria are required, including any after AC3.
- The validation plan includes the repository's required commands.
- Risks/dependencies are explained, unfinished placeholders are absent, and the issue is not assigned exclusively to somebody else.

The issue must use Markdown headings and acceptance checkboxes. If the issue lacks that structure, the bot requests manual review instead of passing it. Ordinary comments do not trigger checks. Edits update the same bot reply. Removing `/request-plan` or deleting the request withdraws the earlier result. Failed API calls do not generate a pass. Requirements are checked at the time of the request; edit/re-submit the plan after issue requirements change.

## Passing reply

> Action Plan Validation Passed — Pending @Kunchana-Wijesinghe Final Approval.
>
> @contributor, your plan has passed the preliminary automated checklist. This is not permission to begin work or merge.
>
> @Kunchana-Wijesinghe, please review the action plan and comment with your approval or requested changes.
>
> Automated checklist response, not an AI review. These rules check structure, command names and keyword coverage; they do not understand or prove that a proposed solution fixes the issue. Automated checks can make mistakes. Wait for @Kunchana-Wijesinghe's reply before starting work.

The workflow does not assign issues, grant GitHub permissions, approve pull requests, merge code, or run contributor-provided code. It reads the current issue and plan as data, runs trusted default-branch rules and creates/updates its own reply. No issue/comment text is interpolated into shell commands. Marking a plan as passing is deliberately advisory: an unrelated or technically incorrect plan can still fool keyword checks. Kunchana remains the final decision maker.

## Validate locally

```sh
node --test .github/scripts/issue-plan-checks.mjs
```

These tests use mocked API calls and do not post GitHub comments. A live smoke test is required after merging: submit a request using the template, verify exactly one bot reply and the reviewer mention, edit it to remove a criterion mapping and confirm the same reply changes to a revision request. No live comments have been posted during local verification.

## Template compatibility

The current validator does not enforce the former 80/150/50/40-character thresholds. It checks brief meaningful content, relevant issue terms, all acceptance-criteria mappings and the configured validation commands. Long text is not treated as proof of correctness. The new clean template and parser are covered together by regression tests.

## Pull-request verification

`plan-review-checks.yml` runs the validator and automated-comment regression tests on pull requests that change this automation. This readonly test workflow can validate PR changes without enabling live issue replies. Live `/request-plan` replies still require `issue-plan-review.yml` and its scripts/config to be published on the default branch; opening an unmerged PR alone does not activate issue comments. No merge or default-branch update is performed by these workflows.
