# Switchyard UI

Angular dashboard for [Switchyard](https://github.com/<you>/switchyard-service) — a distributed, DAG-based workflow orchestrator. This repo is the frontend only; all orchestration logic (scheduler, workers, retries, state) lives in `switchyard-service`.

## What this app does

- Submit workflows (YAML editor or pre-built template picker)
- Visualize DAG execution live — task status, retries, timing (Cytoscape.js)
- Browse past workflow runs and drill into task-level logs

## Tech Stack

- Angular 21 (zoneless, standalone components)
- SCSS
- Cytoscape.js for DAG visualization
- Talks to `switchyard-service`'s FastAPI backend over REST + WebSocket/polling for live status

## Local Development

No local Node/npm install required — everything runs via Docker.

```bash
docker-compose up
```

Visit `http://localhost:4200`. Live reload works via the mounted volume — edit files on your Mac, changes reflect immediately in the container.

### Running one-off Angular CLI commands

```bash
docker run --rm -it -v "$(pwd)":/app -w /app node:20 npx ng generate component dashboard
```

## Configuration

The API base URL `switchyard-service` exposes is configured in `src/environments/environment.ts`. For local dev, this should point at `http://localhost:8000` (wherever the service's docker-compose exposes the FastAPI app).

## Repository Structure

```
switchyard-ui/
├── src/
│   ├── app/
│   │   ├── dashboard/         # DAG visualization
│   │   ├── workflow-submit/   # YAML editor / template picker
│   │   └── services/          # API client for switchyard-service
│   └── environments/
├── angular.json
├── package.json
├── docker-compose.yml
└── README.md
```

## Related Repo

Backend: [switchyard-service](https://github.com/Omkar110401/switchyard-service) — must be running (via its own `docker-compose up`) for this UI to function beyond static routing.