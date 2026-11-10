import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptanceCriteria,
  isPlanRequest,
  reviewPlan,
  formatReview,
} from "./issue-plan-rules.mjs";
import { reviewComment } from "./review-issue-plan.mjs";

const issue = {
  number: 7,
  state: "open",
  title: "Flower catalogue search and pagination",
  body: "## Objective\nAdd flower catalogue search and pagination.\n## Acceptance Criteria\n- [ ] Catalogue search filters flowers by category.\n- [ ] Pagination rejects invalid page numbers.\n## Definition of Done\n- [ ] Reviewed by a maintainer.",
  assignees: [],
};
const commands = ["npm test", "npm run build"];
const plan = `/request-plan
## Issue summary
The flower catalogue needs search and pagination so visitors can find flowers without receiving incorrect page results or losing their selected category.
## Action plan
1. Add catalogue search controls and integrate the query state into the existing catalogue component.
2. Implement pagination validation in the relevant service and preserve the selected category when moving between pages.
3. Test the search and pagination paths, including invalid inputs and empty search results, before submitting a pull request.
## Acceptance criteria coverage
- AC1: Implement catalogue search that filters flowers by category and verify that changing a category updates the visible results.
- AC2: Validate pagination page numbers and reject invalid negative page numbers with a clear validation message.
## Validation
Run npm test and npm run build. Add regression tests for category search, invalid page numbers and empty results; manually check keyboard navigation.
## Risks and dependencies
The catalogue API must support category filtering and consistent pagination; coordinate its contract with the backend maintainer.
`;
const config = { reviewer: "Kunchana-Wijesinghe", requiredCommands: commands };

test("recognizes only the explicit request command on its own first line", () => {
  assert.equal(isPlanRequest(plan), true);
  assert.equal(
    isPlanRequest("ordinary comment mentioning /request-plan"),
    false,
  );
  assert.equal(isPlanRequest("/request-plan-other"), false);
});
test("extracts acceptance checkboxes without Definition of Done items", () =>
  assert.equal(acceptanceCriteria(issue.body).length, 2));
test("passes a complete plan with mapped criteria", () =>
  assert.equal(reviewPlan(issue, plan, commands).status, "passed"));

test("accepts bold AC labels and the new Proposed Solution section", () => {
  const updated = plan
    .replace(
      "## Action plan",
      "## Proposed Solution\nIntegrate catalogue search and pagination through the existing service.\n## Action plan",
    )
    .replace(/- AC(\d+):/g, "- **AC$1:**");
  assert.equal(reviewPlan(issue, updated, commands).status, "passed");
});

test("concise meaningful plans do not require the old character counts", () => {
  const concise = `/request-plan
## Issue Summary
Catalogue search needs pagination.
## Proposed Solution
Connect search with pagination.
## Action Plan
1. Add search controls.
2. Integrate pagination state.
3. Test invalid inputs.
## Acceptance Criteria Coverage
- **AC1:** Filter catalogue by category.
- **AC2:** Reject invalid page numbers.
## Validation
Run npm test; npm run build.
## Risks and Dependencies
None known.
`;
  assert.equal(reviewPlan(issue, concise, commands).status, "passed");
});

test("requires every criterion, including AC3 and subsequent items", () => {
  const expandedIssue = {
    ...issue,
    body: issue.body.replace(
      "## Definition of Done",
      "- [ ] Keyboard navigation remains accessible.\n## Definition of Done",
    ),
  };
  assert.equal(reviewPlan(expandedIssue, plan, commands).status, "changes");
  const complete = plan.replace(
    "## Validation",
    "- **AC3:** Preserve keyboard navigation with accessible controls.\n## Validation",
  );
  assert.equal(reviewPlan(expandedIssue, complete, commands).status, "passed");
});

test("accepts multiline AC explanations and rejects empty proposed solutions", () => {
  const multiline = plan.replace(
    "- AC1: Implement catalogue",
    "- **AC1:**\n  Implement catalogue",
  );
  assert.equal(reviewPlan(issue, multiline, commands).status, "passed");
  const empty = plan.replace(
    "## Action plan",
    "## Proposed Solution\n\n## Action plan",
  );
  assert.equal(reviewPlan(issue, empty, commands).status, "changes");
});
test("missing criterion mapping never passes", () =>
  assert.equal(
    reviewPlan(issue, plan.replace(/^- AC2:.*$/m, ""), commands).status,
    "changes",
  ));
test("unrelated wording cannot pass merely by naming AC1", () =>
  assert.equal(
    reviewPlan(
      issue,
      plan.replace(
        /^- AC1:.*$/m,
        "- AC1: Paint decorative banners and prepare several background animations for a marketing video.",
      ),
      commands,
    ).status,
    "changes",
  ));
test("missing test/build commands and template placeholders fail", () => {
  assert.equal(
    reviewPlan(issue, plan.replace("npm run build", "compile later"), commands)
      .status,
    "changes",
  );
  assert.equal(reviewPlan(issue, `${plan}\nTODO`, commands).status, "changes");
});
test("duplicate and nonexistent criteria are rejected", () => {
  assert.equal(
    reviewPlan(
      issue,
      plan.replace(
        "## Validation",
        "- AC1: Another duplicate coverage mapping for catalogue search filters flowers.\n## Validation",
      ),
      commands,
    ).status,
    "changes",
  );
  assert.equal(
    reviewPlan(
      issue,
      plan.replace(
        "## Validation",
        "- AC99: Another nonexistent coverage mapping for catalogue search filters flowers.\n## Validation",
      ),
      commands,
    ).status,
    "changes",
  );
});
test("missing acceptance criteria requires manual review", () =>
  assert.equal(
    reviewPlan({ ...issue, body: "No checklist" }, plan, commands).status,
    "manual",
  ));
test("someone else's assignment prevents passing", () =>
  assert.equal(
    reviewPlan(
      { ...issue, requester: "alice", assignees: [{ login: "bob" }] },
      plan,
      commands,
    ).status,
    "changes",
  ));
test("passing response mentions reviewer, states limitations, and requires waiting", () => {
  const body = formatReview({
    result: reviewPlan(issue, plan, commands),
    reviewer: config.reviewer,
    author: "alice",
    sourceUrl: "https://github.com/org/repo/issues/7#issuecomment-12",
    marker: "<!-- test -->",
  });
  assert.match(body, /@Kunchana-Wijesinghe/);
  assert.match(body, /not an AI review/);
  assert.match(body, /Wait for/);
  assert.match(body, /not permission to begin work/);
  assert.ok(
    body.includes(
      "Action Plan Validation Passed — Pending @Kunchana-Wijesinghe Final Approval.",
    ),
  );
});

function fixture(overrides = {}) {
  const event = {
    action: "created",
    repository: { full_name: "org/repo" },
    issue,
    comment: {
      id: 12,
      body: plan,
      updated_at: "2026-11-10T00:00:00Z",
      html_url: "https://github.com/org/repo/issues/7#issuecomment-12",
      author_association: "COLLABORATOR",
      user: { login: "alice", type: "User" },
    },
    ...overrides,
  };
  const calls = [];
  const state = { comments: [], source: event.comment };
  const api = async (path, options) => {
    calls.push({ path, options });
    if (options) return {};
    if (path.endsWith("/issues/7")) return event.issue;
    if (path.endsWith("/issues/comments/12")) return state.source;
    return state.comments;
  };
  return { event, calls, state, api };
}
test("ignores ordinary comments, bots, PRs, and non-collaborators", async () => {
  for (const mutate of [
    (e) => {
      e.comment.body = "hello";
    },
    (e) => {
      e.comment.user.type = "Bot";
    },
    (e) => {
      e.issue = { ...issue, pull_request: {} };
    },
    (e) => {
      e.comment.author_association = "NONE";
    },
  ]) {
    const f = fixture();
    mutate(f.event);
    await reviewComment({ ...f, config });
    assert.equal(f.calls.length, 0);
  }
});
test("posts a single reply and updates only its own bot reply after an edit", async () => {
  const f = fixture();
  await reviewComment({ ...f, config });
  const posted = f.calls.find((call) => call.options?.method === "POST");
  assert.ok(posted);
  f.event.action = "edited";
  f.event.comment.body = "/request-plan\nIncomplete";
  f.state.comments = [
    {
      id: 99,
      user: { login: "github-actions[bot]" },
      body: posted.options.body.body,
    },
  ];
  f.calls.length = 0;
  await reviewComment({ ...f, config });
  assert.ok(
    f.calls.some(
      (call) => call.path.endsWith("/99") && call.options?.method === "PATCH",
    ),
  );
  assert.equal(
    f.calls.some((call) => call.options?.method === "POST"),
    false,
  );
});
test("withdraws an earlier result when the request command is removed", async () => {
  const f = fixture();
  f.event.action = "edited";
  f.event.changes = { body: { from: plan } };
  f.event.comment.body = "Request withdrawn";
  f.state.comments = [
    {
      id: 99,
      user: { login: "github-actions[bot]" },
      body: "<!-- floraconnect-plan-review:12 -->\nold pass",
    },
  ];
  await reviewComment({ ...f, config });
  assert.match(
    f.calls.find((call) => call.options?.method === "PATCH").options.body.body,
    /Plan review withdrawn/,
  );
});
test("API errors cannot produce passing comments", async () => {
  const f = fixture();
  await assert.rejects(() =>
    reviewComment({
      event: f.event,
      config,
      api: async () => {
        throw new Error("API unavailable");
      },
    }),
  );
});
test("superseded comment edits are ignored", async () => {
  const f = fixture();
  f.state.source = { ...f.state.source, updated_at: "later" };
  await reviewComment({ ...f, config });
  assert.equal(
    f.calls.some((call) => call.options),
    false,
  );
});
test("deleted request comments withdraw an earlier result", async () => {
  const f = fixture({ action: "deleted" });
  f.state.comments = [
    {
      id: 99,
      user: { login: "github-actions[bot]" },
      body: "<!-- floraconnect-plan-review:12 -->\nold pass",
    },
  ];
  await reviewComment({ ...f, config });
  assert.match(
    f.calls.find((call) => call.options)?.options.body.body,
    /withdrawn/,
  );
});
