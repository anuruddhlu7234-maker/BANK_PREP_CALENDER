# Competitive Exam Command Center — Cloud Edition

This is the complete planner with one shared cloud state. The same saved planner data is used on desktop, mobile, and different browsers after deployment. The frontend files and Render server files are all at the repository root.

## Deploy without editing code

1. Upload/push this folder to a GitHub repository.
2. In Render choose **New → Blueprint**.
3. Select the repository and its `main` branch.
4. Deploy the Blueprint. `render.yaml` creates the Node Web Service and PostgreSQL database and connects `DATABASE_URL` automatically.
5. Open the generated `onrender.com` URL.

No login/authentication is included by design. Anyone who can access the deployed URL can modify the shared planner.

## How synchronization works

- PostgreSQL is the shared source of truth.
- A localStorage copy remains as an offline fallback.
- On first deployment, an existing desktop/local copy is uploaded to the cloud when the cloud database is empty.
- A new browser/device pulls the cloud state automatically.
- Changes are saved locally immediately and queued to the cloud automatically.
- When a browser tab becomes active again, it checks the cloud for newer data.
- **Sync Now** can be used for an immediate pull/push.

## Local development

```bash
npm install
npm start
```

Without `DATABASE_URL`, the server uses a temporary in-memory fallback. For real cross-device persistence, deploy with the Render PostgreSQL database created by `render.yaml`.

## Important Render note

Render currently offers a free web-service plan, but free Postgres databases have a 30-day expiration and no backups. For long-term study history, use a paid Postgres plan or another persistent Postgres provider before the free database expires.
