import { exec } from 'child_process';
import { Router } from 'express';
import { getMongoDb } from '../db/mongoClient';

const router = Router();

router.get('/agents', async (req, res) => {
  const db = await getMongoDb();
  const agents = await db.collection('agents').find().toArray();

  res.status(200).json(agents);
});

router.post('/agents/start', async (req, res) => {
    const { agentId } = req.body;
  
    if (!agentId) {
      res.status(400).json({ error: 'Missing agentId in request body' });
      return;
    }
  
    const command = `docker compose up -d ${agentId}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Failed to start agent "${agentId}":`, stderr);
        res.status(500).json({ error: `Docker error: ${stderr}` });
        return;
      }
  
      console.log(`🚀 Started agent "${agentId}" via Docker Compose`);
      res.status(200).json({
        message: `Agent "${agentId}" started`,
        output: stdout.trim()
      });
      return;
    });
  });
  
export default router;
