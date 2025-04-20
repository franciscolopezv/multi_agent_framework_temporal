# 🧠 AI Multi-Agent Orchestration Platform

This project allows you to create, configure, and orchestrate intelligent agents that collaborate via Temporal workflows. It's designed for scalable, modular, and dynamic multi-agent execution — useful for AI-powered systems, workflow automation, or enterprise orchestration.

---

## 📚 Documentation

The documentation has been organized into the following separate guides:

| Document | Description |
|----------|-------------|
| [USAGE.md](./docs/USAGE.md) | Step-by-step usage guide for creating agents, flows, and executions |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture, components, and diagram |
| [DEVELOPERS.md](./docs/DEVELOPERS.md) | Developer onboarding, CLI, and codebase structure |

Download the full documentation bundle here:  
📦 [docs_bundle.zip](./docs_bundle.zip)

---

## 🐳 Local Development

Use Docker Compose to start Temporal, MongoDB, and sample agents:

```bash
docker compose up --build
```

Access the Temporal UI at [http://localhost:8233](http://localhost:8233)

---

## 🧩 Project Highlights

- Agent registration and dynamic flow execution
- Support for LLMs (OpenAI, Claude) or external APIs
- Handlebars-based templating for flexible input/output
- Parallelism, conditionals, and human-in-the-loop logic
- Full-stack with Temporal + MongoDB + Next.js

---

## 📦 Quick Start

```bash
curl -X POST http://localhost:3000/agents/register \
  -H "Content-Type: application/json" \
  -d '{ "agentId": "summarizer", "prompt": "...", ... }'
```

```bash
curl -X POST http://localhost:3000/api/flows/start \
  -d '{ "flowId": "your_flow", "input": { ... } }'
```

---

MIT License – built with ❤️ for scalable AI systems.
