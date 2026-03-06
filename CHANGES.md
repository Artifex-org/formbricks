# Changes from Upstream Formbricks

This file documents all modifications made to the upstream [formbricks/formbricks](https://github.com/formbricks/formbricks) repository.

**Fork:** [Artifex-org/formbricks](https://github.com/Artifex-org/formbricks)
**License:** AGPL-3.0-or-later (same as upstream)
**Upstream base version:** See `UPSTREAM_VERSION`

---

## v1.1.0 (2026-03-06)

### Added — Admin API for tenant provisioning

New API endpoints under `apps/web/app/api/admin/` for programmatic tenant provisioning.
Authenticated via `ADMIN_API_KEY` env var (constant-time comparison via `x-admin-api-key` header).

- `POST /api/admin/organizations` — Create organization
- `GET /api/admin/organizations/[id]` — Get organization with projects and environments
- `DELETE /api/admin/organizations/[id]` — Delete organization (cascades)
- `POST /api/admin/organizations/[id]/projects` — Create project with dev+prod environments
- `GET /api/admin/environments/[id]/api-keys` — List API keys for an environment
- `POST /api/admin/environments/[id]/api-keys` — Generate API key (fbk_ format, bcrypt+SHA-256 hashed)

New files:
- `apps/web/app/api/admin/auth.ts`
- `apps/web/app/api/admin/organizations/route.ts`
- `apps/web/app/api/admin/organizations/[id]/route.ts`
- `apps/web/app/api/admin/organizations/[id]/projects/route.ts`
- `apps/web/app/api/admin/environments/[id]/api-keys/route.ts`

---

## v1.0.0 (2026-03-06)

**Base:** Formbricks v4.7.5 (upstream main @ 299ae81b2)

### Added
- `CHANGES.md` — modification tracking (AGPLv3 compliance)
- `UPSTREAM_VERSION` — tracks upstream base version
- `README.md` — fork notice header
- `.github/workflows/build.yml` — Docker image build on tags

### No functional changes
This is the unmodified upstream codebase as the baseline release.
