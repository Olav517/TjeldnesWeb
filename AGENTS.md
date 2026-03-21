# AGENTS.md — tjeldnesWeb

This file provides guidance for agentic coding agents operating in this repository.
It is derived from `.github/copilot-instructions.md`, existing configs, and codebase analysis.

---

## Repository Overview

A CDK TypeScript monorepo with:
- **Root** (`src/`, `test/`) — AWS CDK v2 infrastructure (TypeScript)
- **`homePage/`** — Public React 19 + Vite 6 + TypeScript frontend (S3/CloudFront-served)
- **`dynamichomePage/`** — Authenticated React 19 + Vite 6 + TypeScript frontend (Lambda-served, Cognito OIDC)
- **`dynamicBackend/`** — Express 5 API server (local dev only; no deploy scripts)
- **`APIs/scoreboard/`** and **`APIs/visitorcounter/`** — Python 3 Lambda functions

There is **no workspace manager**. Each sub-folder is an independent package. All `npm` commands must be run from inside the relevant sub-directory unless otherwise noted.

---

## Build / Lint / Test Commands

### Root (CDK Infrastructure)

```bash
npm run build          # Compile TypeScript (tsc)
npm run watch          # Watch mode TypeScript compile
npm run test           # Run all Jest tests (test/**/*.test.ts)
npm run lint           # ESLint over src/, test/
npm run lint:all       # ESLint across ALL sub-projects (root + homePage + dynamichomePage + dynamicBackend)

npx cdk synth          # Synthesise CloudFormation templates (validates infra)
npx cdk deploy         # Deploy stacks to AWS
```

#### Running a single Jest test
```bash
# By file path
npx jest test/example-module.test.ts

# By test name (regex match)
npx jest -t "add function works"

# Watch mode for a file
npx jest --watch test/example-module.test.ts
```

### homePage (Static Frontend)

```bash
cd homePage
npm ci                 # Reproducible install
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build  →  produces dist/
npm run lint           # ESLint
npm run preview        # Preview production build
```

> **Important**: `homePage/dist/` is committed and relied on by CDK's `BucketDeployment`. Always rebuild and commit `dist/` when making frontend changes.

### dynamichomePage (Dynamic/Authenticated Frontend)

```bash
cd dynamichomePage
npm ci
npm run dev            # Vite dev server
npm run build          # Compiles lambda/handler.ts + tsc -b + vite build
npm run build:lambda   # Compiles lambda/handler.ts only  →  lambda/handler.js
npm run lint
```

> **Important**: `dynamichomePage/lambda/handler.js` is committed (compiled output). Rebuild with `npm run build:lambda` after editing `lambda/handler.ts`.

### dynamicBackend (Express API)

```bash
cd dynamicBackend
npm ci
npm run lint           # ESLint
# No build/test scripts. Run with ts-node if needed.
```

### Python APIs

No automated test runner is configured. Python code lives in `APIs/scoreboard/` and `APIs/visitorcounter/`. Dependencies are listed in `APIs/scoreboard/requirements.txt`.

---

## Node Version

- **CI uses Node 22** (`nodejs 22.14.0` per `.tool-versions`)
- Use `nvm use 22` (or equivalent) locally to match CI
- `.tool-versions` (asdf): `node 20.11.1`, `nodejs 22.14.0`, `terraform 1.12.1`

---

## TypeScript Configuration

### Root (`tsconfig.json`) — CDK infra
- `target: ES2020`, `module: commonjs`, `strict: true`
- `noImplicitAny: true`, `strictNullChecks: true`, `noImplicitReturns: true`
- `experimentalDecorators: true`, `strictPropertyInitialization: false`
- Deliberately **excludes** `homePage/`, `dynamichomePage/`, `dynamicBackend/`

### Frontend (`homePage/`, `dynamichomePage/`) — stricter
- `target: ES2020`, `module: ESNext`, `jsx: react-jsx`
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `moduleResolution: bundler`, `noEmit: true` (Vite handles output)
- `erasableSyntaxOnly: true`, `noUncheckedSideEffectImports: true`

---

## Code Style

### General

- **No formatter** (no Prettier or Biome). Rely on ESLint only.
- ESLint uses **flat config** format (`eslint.config.mjs`) — ESLint v9/v10.
- Use `npm ci` for installs (not `npm install`) to ensure reproducible lockfile installs.

### Imports

- CDK infra uses namespace imports: `import * as cdk from 'aws-cdk-lib'`
- Named imports for specific constructs: `import { Construct } from 'constructs'`
- React components use named or default imports per module convention
- No barrel index files; import directly from the source file
- External env values: `import.meta.env.VITE_*` for Vite build-time vars; `window.__env__` for Lambda-injected runtime config

### Naming Conventions

| Item | Convention |
|---|---|
| Classes, Components, Interfaces | `PascalCase` |
| Functions, variables, props | `camelCase` |
| CDK construct IDs (strings) | `kebab-case` |
| Files (frontend components) | `camelCase.tsx` (e.g., `sidebar.tsx`) |
| Test files | `kebab-case.test.ts` |
| Constants | `camelCase` (no `SCREAMING_SNAKE`) |
| React hook files | `camelCase`, function name prefixed with `use` |

### CDK Infrastructure Patterns

- Every stack defines a `Props` interface extending `cdk.StackProps`
- Use JSDoc comments on all interface properties
- Expose cross-stack outputs as `public readonly` properties
- Thread `projectPrefix` through all stacks for consistent resource naming
- Stack class constructors: `constructor(scope: Construct, id: string, props: Props)`

### React / Frontend Patterns

- **Functional components only** — no class components
- Type components: `React.FC<Props>` when props exist; plain `function` for no-props components
- Default exports for pages and components; named exports for utilities/hooks
- Co-locate CSS: import `'./ComponentName.css'` alongside the component file
- Use React hooks (`useState`, `useEffect`, `useAuth`) from the top level of components
- `useAuth` hook from `react-oidc-context` for authentication state in `dynamichomePage`

### Python (APIs/)

- Module-level boto3 client instantiation
- Handler signature: `def handler(event, context):`
- Use `logging.exception()` for error logging
- Config via `os.environ.get()` / `os.environ[]`
- Handle CORS preflight inline: `if event.get("httpMethod") == "OPTIONS":`

---

## Error Handling

- TypeScript: leverage `strict: true` + `noImplicitReturns`; avoid `any` types
- Always return proper HTTP responses from Lambda/API handlers (status + body + CORS headers)
- Python Lambdas: wrap handler body in `try/except`; log with `logging.exception()`; return 500 on unhandled errors
- Never swallow exceptions silently

---

## Testing (Jest — CDK Infra)

- Tests live in `test/` at the repo root, matching `**/*.test.ts`
- Framework: **Jest 29** + **ts-jest**
- `testEnvironment: 'node'`
- Jest globals available without explicit import (`test`, `expect`, etc.)
- Use bare `test()` calls; `describe` blocks are optional but welcome for grouping
- CDK assertion tests should use `aws-cdk-lib/assertions` (`Template.fromStack()`)

**No test framework is configured** for `homePage`, `dynamichomePage`, or `dynamicBackend`.

---

## CI / Deployment

- CI workflow: `.github/workflows/ci.yaml`
- Deployment only triggers on `main` branch pushes
- CI steps: build `homePage`, build Docker image for `dynamichomePage`, run `npx cdk synth`, zip CDK source, push to S3 → triggers CodePipeline via EventBridge
- Self-mutating CodePipeline defined in `src/pipelines/pipeline.ts`
- Multi-region: ACM cert in `us-east-1` (CloudFront), API GW cert in `eu-central-1`

---

## Key Files

| File | Purpose |
|---|---|
| `src/app.ts` | CDK app entrypoint |
| `src/config.ts` | Centralised config (`projectPrefix`, region, account) |
| `cdk.json` | CDK app definition (`npx ts-node --prefer-ts-exts src/app.ts`) |
| `jest.config.ts` | Jest configuration (root only) |
| `eslint.config.mjs` | Root ESLint flat config |
| `homePage/dist/` | Committed build output — required by CDK deployment |
| `dynamichomePage/lambda/handler.js` | Committed compiled Lambda handler |
| `.github/workflows/ci.yaml` | CI/CD pipeline definition |
| `.kiro/specs/` | Architecture design, requirements, and task specs |
