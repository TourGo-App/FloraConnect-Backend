import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL, pathToFileURL } from "node:url";
import {
  isPlanRequest,
  reviewPlan,
  formatReview,
} from "./issue-plan-rules.mjs";

export async function reviewComment({ event, config, api }) {
  if (
    !event.issue ||
    event.issue.pull_request ||
    event.comment?.user?.type === "Bot"
  )
    return;
  if (
    !["OWNER", "MEMBER", "COLLABORATOR"].includes(
      event.comment?.author_association,
    )
  )
    return;
  const wasRequest = isPlanRequest(event.changes?.body?.from);
  if (!isPlanRequest(event.comment?.body) && !wasRequest) return;
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(config.reviewer))
    throw new Error("Configure a valid reviewer login.");
  const base = `/repos/${event.repository.full_name}`;
  const issue = await api(`${base}/issues/${event.issue.number}`);
  if (issue.state !== "open") return;
  const source =
    event.action === "deleted"
      ? null
      : await api(`${base}/issues/comments/${event.comment.id}`);
  // An older queued delivery must not publish a result for a superseded edit.
  if (source && source.updated_at !== event.comment.updated_at) return;
  const marker = `<!-- floraconnect-plan-review:${event.comment.id} -->`;
  const comments = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await api(
      `${base}/issues/${issue.number}/comments?per_page=100&page=${page}`,
    );
    comments.push(...batch);
    if (batch.length < 100) break;
    if (page === 50)
      throw new Error("Too many comments; manual review required.");
  }
  const existing = comments.find(
    (comment) =>
      comment.user?.login === "github-actions[bot]" &&
      comment.body?.startsWith(marker),
  );
  const withdrawn = !source || !isPlanRequest(source.body);
  if (withdrawn && !existing) return;
  const result = withdrawn
    ? { status: "withdrawn", reasons: [], criteriaCount: 0 }
    : reviewPlan(
        { ...issue, requester: source.user.login },
        source.body,
        config.requiredCommands,
      );
  const body = formatReview({
    result,
    reviewer: config.reviewer,
    author: event.comment.user.login,
    sourceUrl: event.comment.html_url,
    marker,
  });
  if (body === existing?.body) return;
  if (existing)
    await api(`${base}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: { body },
    });
  else
    await api(`${base}/issues/${issue.number}/comments`, {
      method: "POST",
      body: { body },
    });
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token)
    throw new Error("GITHUB_TOKEN must be supplied by GitHub Actions.");
  const event = JSON.parse(
    await readFile(process.env.GITHUB_EVENT_PATH, "utf8"),
  );
  const config = JSON.parse(
    await readFile(
      new URL("../plan-review-config.json", import.meta.url),
      "utf8",
    ),
  );
  const api = async (path, { method = "GET", body } = {}) => {
    const response = await globalThis.fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: globalThis.AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        `GitHub API returned HTTP ${response.status}; no approval was issued.`,
      );
    return response.status === 204 ? null : response.json();
  };
  await reviewComment({ event, config, api });
}

// Importing this module in tests must never contact GitHub.
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  main().catch((error) => {
    process.stderr.write(`Plan review failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
