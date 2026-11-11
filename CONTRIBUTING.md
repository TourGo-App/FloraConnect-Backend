# Contributing to FloraConnect Backend

Thank you for contributing to FloraConnect! This guide establishes standard workflows, Git conventions, and quality gates to keep our Express 5 + TypeScript backend reliable and easy to maintain.

---

## 🛠️ 1. Getting Started & Local Setup

### Prerequisites
* **Node.js**: v22 LTS (verify with `node -v`)
* **npm**: v10+ (verify with `npm -v`)
* **Database**: PostgreSQL (local instance or free [Neon Serverless](https://neon.tech))

### Installation
1. Clone the repository and navigate into the folder:
   ```bash
   git clone https://github.com/TourGo-App/FloraConnect-Backend.git
   cd FloraConnect-Backend
   ```
2. Install exact dependencies:
   ```bash
   npm ci
   ```
3. Setup environment variables:
   * Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   * Set your `DATABASE_URL` (e.g. your Neon connection string) and a secure `JWT_SECRET`.
4. Run the local development server:
   ```bash
   npm run dev
   ```
5. Verify health endpoint in your browser or terminal:
   * URL: `http://localhost:3001/api/health`
   * Expected response: `{"status":"ok","service":"FloraConnect API"}`

---

## 🌿 2. Git Branching & Workflow

### Choosing an Issue
1. Check the [Open GitHub Issues](https://github.com/TourGo-App/FloraConnect-Backend/issues).
2. Request assignment or comment on the issue you wish to work on before writing code.

### Branch Naming Conventions
Always branch out from the latest `main`:
```bash
git checkout main
git pull --ff-only origin main
git checkout -b <branch-type>/BE-<issue-number>-<short-description>
```

### Push your branch and open a pull request

Keep `main` synchronized with GitHub and commit work on a separate branch. Push that branch instead of pushing directly to `main`:

```bash
git push -u origin HEAD
```

Open a pull request targeting `main` and wait for maintainer approval before merging.

### Recovering from a non-fast-forward rejection

The remote branch contains commits missing from your local history. `git pull` is two words; `gitpull` is not a command. Inspect first:

```bash
git fetch origin
git status
git log --oneline --graph --decorate -12
git rev-list --left-right --count origin/main...main
```

If local `main` is only behind and your working tree is clean, run `git switch main` then `git pull --ff-only origin main`. If local commits exist, preserve them on a separate branch and submit intended changes through a PR. Commit or stash unfinished work before switching branches. Never force-push shared `main`.

`Merge made by the 'ort' strategy` means the pull succeeded and created a merge commit. Compare `git diff origin/main main`: changes already merged remotely do not need a duplicate PR. Preserve a backup branch before removing redundant local history.

**Branch Prefixes:**
* `feat/` — New feature or API endpoint (e.g., `feat/BE-04-user-registration`)
* `fix/` — Bug fix or correction (e.g., `fix/BE-05-cookie-expiry`)
* `test/` — Unit, integration, or load test suite (e.g., `test/BE-18-postman-suite`)
* `refactor/` — Code improvement without changing API contract (e.g., `refactor/BE-02-zod-middleware`)
* `docs/` — Documentation or OpenAPI specs (e.g., `docs/BE-02-openapi-spec`)

---

## ✍️ 3. Commit Message Standards

We use [Conventional Commits](https://www.conventionalcommits.org/):
```text
<type>(<scope>): <short descriptive summary in imperative mood>

[optional body]

[optional issue reference]
```

**Examples:**
* `feat(auth): implement user registration endpoint with argon2id`
* `fix(cors): allow preview origins for vercel deployments`
* `test(flowers): add supertest integration suite for flower catalogue`
* `docs(readme): update neon database setup commands`

---

## 🧪 4. Pre-PR Quality Checks

Before committing and pushing, **always run the local verification suite**. If any check fails, resolve it locally before opening a pull request:

```bash
# 1. Typecheck TypeScript strictly
npm run typecheck

# 2. Run automated test suite
npm test

# 3. Verify clean production build
npm run build
```

---

## 🚀 5. Submitting a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin <your-branch-name>
   ```
2. Open a Pull Request targeting `main`.
3. Use the standardized PR title:
   * `[BE-XX] Concise description of the change` (e.g., `[BE-04] User Registration API`)
4. Complete the automated PR template:
   * Link the issue using GitHub keywords (e.g. `Fixes #4` or `Closes #4`).
   * Attach verification evidence (screenshots of passing tests or Supertest output).
5. Request a review from the maintainers. Passing GitHub Actions CI checks are required for merge approval.

