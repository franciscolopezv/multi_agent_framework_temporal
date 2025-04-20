# 📘 Usage Guide

This guide walks you through using the platform as a user or operator.

## 🔹 Step 1: Register an Agent

Use the `/agents/register` API to define an LLM-based or external agent.

```bash
curl -X POST http://localhost:3000/agents/register \
  -H "Content-Type: application/json" \
  -d '{ "agentId": "summarizer", ... }'
```

## 🔹 Step 2: Create a Flow

Define a multi-step workflow with agents, conditionals, and parallel steps.

```json
{
  "_id": "flowId",
  "steps": [
    { "agent": "a", "activityName": "doSomething", "input": "{{input}}" },
    ...
  ]
}
```

Submit it using:

```bash
curl -X POST http://localhost:3000/api/flows/new ...
```

## 🔹 Step 3: Start the Flow

```bash
curl -X POST http://localhost:3000/api/flows/start \
  -d '{ "flowId": "flowId", "input": { "text": "..." } }'
```

## 🔹 Step 4: Monitor in Temporal UI

Visit [http://localhost:8233](http://localhost:8233) to view progress.

---

### ✍️ Signal-based steps

If a step includes `waitForSignal`, use this to resume:

```bash
curl -X POST http://localhost:3000/api/flows/signal \
  -d '{ "workflowId": "...", "signal": "managerApproval", "payload": { ... } }'
```