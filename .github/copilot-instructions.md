# Copilot instructions for tjeldnesWeb

This repository is a CDK TypeScript project with two React/Vite frontends and a small Express backend. Keep edits focused and avoid changing unrelated projects.

Build, test, and lint
- Root (infrastructure):
  - Build TypeScript: npm run build
  - Run tests: npm run test (runs Jest configured in jest.config.js)
  - Run a single Jest test file: npx jest <path/to/test/file.test.ts>
  - Run a single test name: npx jest -t "test name regex"
  - CDK commands: npx cdk synth | npx cdk deploy

- homePage (frontend):
  - Dev server: cd homePage && npm ci && npm run dev
  - Build: cd homePage && npm ci && npm run build
  - Lint: cd homePage && npm run lint

- dynamichomePage (containerized frontend):
  - Build (used by CI): cd dynamichomePage && npm ci && docker build -t <image> .
  - Dev: cd dynamichomePage && npm run dev

- dynamicBackend (Express API):
  - No standard build scripts. Run with node/ts-node if needed; dependencies listed in dynamicBackend/package.json

High-level architecture
- infra/stack (root): AWS CDK app lives in src/ and bin/; cdk.json configures the app. CI runs `npx cdk synth` to validate infra.
- homePage and dynamichomePage: separate React + Vite apps producing dist/ artifacts. homePage/dist is included in deployment zip created by CI.
- dynamicBackend: small Express service (JWT + JWKS usage) intended to run as a container.
- CI pipeline (.github/workflows/ci.yaml): builds homePage, builds docker image for dynamichomePage, runs `npx cdk synth`, zips CDK source and optionally pushes the docker image to ECR.

Key conventions
- Tests: Jest configured at repository root; tests are expected under test/ and match **/*.test.ts. Run single tests with npx jest <file> or -t for names.
- Node version: CI uses Node 22; prefer matching local Node (nvm/use Node 22) for reproducing CI.
- Frontends use Vite + TypeScript. Use `npm ci` in CI and for reproducible installs.
- There is no workspace manager; treat subfolders as independent packages (run commands inside each folder).
- Linting: frontends include `npm run lint` (ESLint). Root project has no lint script.
- Build artifacts: homePage/dist is relied on by CI and packaging.

Other assistant configs
- Found CI workflow at .github/workflows/ci.yaml. No CLAUDE.md, AIDER or Windsurf rules detected.

If you want, I can also add MCP server configs (e.g., Playwright or a web test runner). 

