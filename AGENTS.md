# AGENTS.md — tjeldnesWeb

CDK TypeScript monorepo, no workspace manager — each folder is an independent
npm package. Run `npm` commands from inside the relevant sub-directory.

- **Root** (`src/`, `bin/`, `test/`) — AWS CDK v2 infra (TypeScript)
- **`homePage/`** — public React 19 + Vite 6 frontend, deployed to S3/CloudFront
- **`dynamichomePage/`** — authenticated React 19 + Vite 6 frontend (Cognito OIDC via `react-oidc-context`), served by a Lambda (`lambda/handler.ts`) behind API Gateway HTTP API — **not** Docker
- **`dynamicBackend/`** — Express 5 API, local dev only, no deploy path
- **`APIs/scoreboard/`, `APIs/visitorcounter/`** — Python 3.13 Lambda handlers (entry file `api.py`, function `handler(event, context)`), deployed straight from source via `lambda.Code.fromAsset(...)`

## Commands

Root:
```bash
npm run build       # tsc
npm run test        # jest, tests in test/**/*.test.ts
npx jest test/foo.test.ts       # single file
npx jest -t "test name regex"   # single test by name
npm run lint         # eslint src/ test/
npm run lint:all     # lint root + homePage + dynamichomePage + dynamicBackend
npx cdk synth        # validate infra
```

`homePage/` and `dynamichomePage/`: `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint`.
`dynamichomePage` build also runs `npm run build:lambda` first (compiles `lambda/handler.ts` → `lambda/handler.js` in place via `lambda/tsconfig.json`).
`dynamicBackend`: only `npm run lint` is real — its `npm test` is a placeholder that always exits 1, not an indicator of a real test suite.

No test framework exists for `homePage`, `dynamichomePage`, or `dynamicBackend`. No automated Python tests for `APIs/`.

## Gotchas

- **CI does not lint or run Jest.** `.github/workflows/ci.yaml` only builds `homePage` and `dynamichomePage` and runs `npx cdk synth`. Run `npm run lint:all` and `npm test` yourself before pushing — nothing else will catch regressions.
- **`cdk synth`/`cdk deploy` read frontend build output straight off disk, not from git.** `WebsiteResourcesStack` sources `./homePage/dist` and `DynamicWebpageStack` packages the whole `./dynamichomePage` folder (dist + compiled `lambda/handler.js`) as Lambda code. You must run `npm run build` in `homePage/` and `dynamichomePage/` before synth/deploy or you'll ship stale or missing assets.
- `dynamichomePage/lambda/handler.js` is a build artifact and is gitignored (`*.js` is in `.gitignore`) — it is *not* committed. It only needs to exist on disk before synth/deploy; CI's `npm run build` step regenerates it.
- `dynamichomePage/dockerfile`, `nginx.conf`, `entrypoint.sh` are leftovers from an earlier container-based deploy and are unused by the current Lambda-based stack — don't assume Docker is part of the deploy path.
- `homePage/dist` and `dynamichomePage/dist` are committed to git; rebuild and commit them if you change frontend source and want the checked-in copy to stay in sync (though CI/CDK will regenerate them anyway on deploy).
- Deployment only happens on pushes to the default branch (`main`): CI zips CDK source + both `dist/` dirs + `dynamichomePage/lambda` + `APIs`, uploads to S3, which triggers a self-mutating CodePipeline (`src/pipelines/pipeline.ts`, stages in `src/stages/`).
- Root `tsconfig.json` excludes `homePage/`, `dynamichomePage/`, `dynamicBackend/` — each has its own, stricter tsconfig (`noUnusedLocals`/`noUnusedParameters` true, `erasableSyntaxOnly`).
- ESLint uses flat config (`eslint.config.ts` per package, not `.mjs`) — no Prettier/Biome in this repo.

## Conventions worth preserving

- CDK stacks: `Props` interface extends `cdk.StackProps`, JSDoc on props, cross-stack values exposed as `public readonly`, `projectPrefix` threaded through for resource naming.
- Python Lambdas: module-level boto3 client, `logging.exception()` on errors, config via `os.environ`, inline `OPTIONS` CORS handling.

## References

- `.kiro/specs/tjeldnes-web-system/` — requirements/design/tasks docs for the overall system.
- `.github/copilot-instructions.md` exists but is stale (describes a Docker-based `dynamichomePage` deploy and a committed `handler.js` — both no longer true); prefer this file.
