# 👨‍💻 Developer Onboarding Guide

Welcome! Here's how to contribute and extend the platform.

---

## ✅ Prerequisites

- Node.js + npm
- Docker + Docker Compose
- MongoDB CLI or Compass (optional)
- [Temporal CLI](https://docs.temporal.io)

---

## 🛠 Setup

```bash
git clone https://github.com/your-org/project.git
cd project
npm install
docker compose up --build
```

---

## 🧪 Useful Scripts

- Generate a new agent:

```bash
npx ts-node scripts/generate-agent.ts summarizer --activity summarizeIdea --llm gpt-4 ...
```

- Start local orchestrator worker:

```bash
npm run start:orchestrator
```

---

## 📁 Folder Highlights

| Folder | Description |
|--------|-------------|
| `agents/` | Each agent has its own logic and worker |
| `templates/agent/` | Handlebars templates used to scaffold agents |
| `scripts/` | CLI tools (e.g., generate-agent.ts) |
| `orchestrator/` | Workflow logic (`dynamicOrchestrator`) |
| `api/` | Express API for agents/flows |
| `ui/` | Next.js frontend |

---

## 📦 Adding a New Agent Template

1. Add `activities.ts.hbs`, `worker.ts.hbs`, `Dockerfile.hbs`, and `package.json.hbs`
2. Use `scripts/generate-agent.ts` to scaffold
3. Add agent to `docker-compose.yml` (or use API to auto-append)

---

## ✅ Testing

- Unit tests: `npm run test`
- Run end-to-end with mock LLMs via test flows

---

## 🤝 Contributing

- All agent logic should be stateless
- Prefer prompt configuration over hardcoded behavior
- Keep flows dynamic and UI-first