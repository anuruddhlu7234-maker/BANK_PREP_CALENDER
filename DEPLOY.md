# Deploy

Use Render **Blueprint**, not Static Site.

This repository is flat and deployment-ready at the root.

Render reads `render.yaml` and creates:
- Web Service: `competitive-exam-command-center`
- Postgres: `competitive-exam-command-center-db`

The Web Service uses:
- Build: `npm install`
- Start: `npm start`
- Health: `/api/health`

No Publish Directory is required.

After deployment, every browser/device talks to the same `/api/state` endpoint and PostgreSQL row, so the desktop and mobile use the same planner data.
