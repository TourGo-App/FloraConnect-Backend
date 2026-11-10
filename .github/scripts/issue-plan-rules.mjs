const stopWords = new Set(
  "the and with from that this these those have has will must should into through using users user create implement implementation develop build provide support ensure enable allow existing relevant correctly required requirements objective interface system platform application flora floraconnect frontend backend acceptance criteria api test tests testing validation plan action solution issue add updated update verify display handles handle".split(
    " ",
  ),
);

function terms(text) {
  return new Set(
    (text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [])
      .map((word) => word.replace(/(?:ing|ed|s)$/, ""))
      .filter((word) => word.length > 2 && !stopWords.has(word)),
  );
}

function sharedTerms(left, right) {
  return [...terms(left)].filter((word) => terms(right).has(word)).length;
}

export function section(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(
    (line) =>
      /^#{1,6}\s/.test(line) &&
      line.toLowerCase().includes(heading.toLowerCase()),
  );
  if (start === -1) return "";
  let end = start + 1;
  while (end < lines.length && !/^#{1,6}\s/.test(lines[end])) end++;
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
}

export function acceptanceCriteria(body) {
  return [
    ...section(body, "acceptance criteria").matchAll(
      /^\s*[-*]\s+\[[ xX]\]\s+(.+)$/gm,
    ),
  ].map((match) => match[1].trim());
}

export function isPlanRequest(body) {
  return /^\s*\/request-plan\s*(?:\r?\n|$)/i.test(body ?? "");
}

/** Mechanical evidence checks only. Never a claim of semantic or code correctness. */
export function reviewPlan(issue, body, requiredCommands) {
  const criteria = acceptanceCriteria(issue.body ?? "");
  if (!criteria.length)
    return {
      status: "manual",
      reasons: [
        "The issue needs a Markdown Acceptance Criteria heading with checkbox items before automated coverage checks can run.",
      ],
      criteriaCount: 0,
    };
  const reasons = [];
  const summary = section(body, "issue summary");
  const steps = section(body, "action plan");
  const coverage = section(body, "acceptance criteria coverage");
  const validation = section(body, "validation");
  const risks = section(body, "risks and dependencies");
  const core = `${issue.title} ${section(issue.body ?? "", "objective")}`;
  const solution = section(body, "proposed solution");
  const meaningful = (text) =>
    (text.replace(/[*_`]/g, "").match(/[a-z0-9]+/gi) ?? []).length >= 3;
  if (!meaningful(summary) || sharedTerms(core, summary + " " + solution) < 1)
    reasons.push(
      "Explain the affected feature, current problem and expected outcome using the issue's own subject terms.",
    );
  // Proposed Solution is supported; older requests without it remain compatible.
  if (/^#{1,6}\s+proposed solution/im.test(body) && !meaningful(solution))
    reasons.push("Explain the technical approach under Proposed Solution.");
  const stepLines = steps
    .split(/\r?\n/)
    .filter((line) => /^\s*(?:[-*]|\d+[.)])\s+\S/.test(line));
  if (stepLines.filter(meaningful).length < 3)
    reasons.push(
      "Provide implementation, integration and verification steps with a brief explanation of each.",
    );
  const mappings = [];
  for (const line of coverage.replace(/\*\*|__/g, "").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*]\s*)?AC(\d+)\s*:\s*(.*)$/i);
    if (match) mappings.push([match[0], match[1], match[2]]);
    else if (mappings.length && line.trim())
      mappings[mappings.length - 1][2] += " " + line.trim();
  }
  const seen = new Set();
  for (const match of mappings) {
    const number = Number(match[1]);
    if (seen.has(number))
      reasons.push(
        `AC${number} is repeated; provide one mapping per criterion.`,
      );
    seen.add(number);
    if (number < 1 || number > criteria.length)
      reasons.push(`AC${number} does not exist in this issue.`);
  }
  criteria.forEach((criterion, index) => {
    const mapping =
      mappings.find((match) => Number(match[1]) === index + 1)?.[2] ?? "";
    if (
      !meaningful(mapping) ||
      (terms(criterion).size && sharedTerms(criterion, mapping) < 1)
    )
      reasons.push(
        `AC${index + 1}: explain how this criterion will be satisfied, using its subject terms. Include every criterion from the issue.`,
      );
  });
  if (!meaningful(validation))
    reasons.push("Describe the tests and manual checks you will perform.");
  for (const command of requiredCommands)
    if (!validation.toLowerCase().includes(command.toLowerCase()))
      reasons.push(`Include the validation command: ${command}.`);
  if (
    !meaningful(risks) &&
    !/^(?:none|no known|not applicable|n\/a)\b/i.test(risks)
  )
    reasons.push(
      "Identify risks and dependencies, or explicitly state when none are known.",
    );
  if (/\b(?:TODO|TBD|fill in|your plan here)\b/i.test(body))
    reasons.push(
      "Replace unfinished template placeholders before requesting review.",
    );
  if (
    issue.assignees?.length &&
    !issue.assignees.some(
      (user) => user.login?.toLowerCase() === issue.requester?.toLowerCase(),
    )
  )
    reasons.push(
      "This issue is already assigned to someone else; coordinate ownership with the maintainer.",
    );
  return {
    status: reasons.length ? "changes" : "passed",
    reasons: [...new Set(reasons)],
    criteriaCount: criteria.length,
  };
}

export function formatReview({ result, reviewer, author, sourceUrl, marker }) {
  const headings = {
    passed: `Action Plan Validation Passed — Pending @${reviewer} Final Approval.`,
    changes: "Action plan needs more detail",
    manual: "Maintainer review required",
    withdrawn: "Plan review withdrawn",
  };
  const intro =
    result.status === "passed"
      ? `@${author}, your plan has passed the preliminary automated checklist, including mappings for ${result.criteriaCount} acceptance criteria. **This is not permission to begin work or merge.**\n\n@${reviewer}, please review the action plan and comment with your approval or requested changes.`
      : result.status === "withdrawn"
        ? "The request command was removed or the plan comment was deleted. Any earlier checklist result for this comment is withdrawn."
        : `@${author}, please address the following before requesting approval:\n\n${result.reasons.map((reason) => `- ${reason}`).join("\n")}${result.status === "manual" ? `\n\n@${reviewer}, this request needs your review.` : "\n\nEdit your original /request-plan comment to run the checks again."}`;
  return `${marker}\n## ${headings[result.status]}\n\n${intro}\n\n[Contributor's action plan](${sourceUrl})\n\n> **Automated checklist response, not an AI review.** These rules check structure, command names and keyword coverage; they do not understand or prove that a proposed solution fixes the issue. Automated checks can make mistakes. **Wait for @${reviewer}'s reply before starting work.**`;
}
