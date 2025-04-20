import { exec } from 'child_process';
import { Request, Response } from 'express';

export async function startAgent(req: Request, res: Response) {
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: 'Missing agentId' });
  }

  const command = `docker compose up -d ${agentId}`;
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Failed to start agent ${agentId}:`, stderr);
      return res.status(500).json({ error: `Failed to start agent: ${stderr}` });
    }

    console.log(`🚀 Agent ${agentId} started via Docker Compose`);
    return res.status(200).json({ message: `Agent ${agentId} started`, output: stdout });
  });
}
