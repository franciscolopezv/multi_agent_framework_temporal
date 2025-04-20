import { Router } from 'express';
import { getMongoDb } from '../db/mongoClient';

const router = Router();

type FlowDoc = {
    _id: string;
    name: string;
    version: string;
    steps: any[];
    createdAt: string;
  };

router.post('/flows/new', async (req, res) => {
    const { name, version = 'v1', steps } = req.body;

    if (!name || !Array.isArray(steps)) {
      res.status(400).json({ error: 'Flow name and steps[] are required' });
      return;
    }
  
    const db = await getMongoDb();
  
    // ✅ Step 1: Load registered agent IDs
    const registeredAgents = await db.collection('agents').find({}, { projection: { agentId: 1 } }).toArray();
    const validAgentIds = new Set(registeredAgents.map((a) => a.agentId));
  
    // ✅ Step 2: Flatten all agent references (including parallel steps)
    function extractAgentIds(steps: any[]): string[] {
      const agentIds: string[] = [];
  
      for (const step of steps) {
        if (step.parallel && Array.isArray(step.steps)) {
          agentIds.push(...extractAgentIds(step.steps));
        } else if (step.agent) {
          agentIds.push(step.agent);
        }
      }
  
      return agentIds;
    }
  
    const referencedAgents = extractAgentIds(steps);
    const missingAgents = referencedAgents.filter((agentId) => !validAgentIds.has(agentId));
  
    if (missingAgents.length > 0) {
      res.status(400).json({
        error: 'Some agents in the flow are not registered',
        missingAgents
      });

      return;
    }
  
  const flowDoc: FlowDoc = {
    _id: `${name}:${version}`,
    name,
    version,
    steps,
    createdAt: new Date().toISOString()
  };
  
  const existing = await db.collection('flows').findOne({ name, version });
  if (existing) {
    res.status(409).json({ error: 'Flow with this name and version already exists' });
    return;
  }

  await db.collection<FlowDoc>('flows').insertOne(flowDoc);  

  // Create UI-friendly agent list
  const agentsUsed = referencedAgents.map((agentId) => {
    const info = registeredAgents.find((a) => a.agentId === agentId);
    return {
      agentId,
      description: info?.metadata?.description || '',
      status: info?.status || 'unknown'
    };
  });
  
  res.status(201).json({
    message: 'Flow created successfully',
    flow: {
      id: flowDoc._id,
      name: flowDoc.name,
      version: flowDoc.version,
      createdAt: flowDoc.createdAt,
      steps: flowDoc.steps,
      agentsUsed
    }
  });
  return;
});

export default router;
