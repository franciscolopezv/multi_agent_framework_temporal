import cors from 'cors';
import express, { Request, Response } from 'express';
import { getMongoDb } from '../db/mongoClient';
import agentRoutes from './agentRoutes';
import flowRoutes from './flowRoutes';
import { scaffoldAgentFromApi } from './scaffoldAgentService';

const app = express();
app.use(express.json());

// Register API routes
app.use(agentRoutes);
app.use(flowRoutes);

app.use(cors({ origin: 'http://localhost:3001' })); // adjust to Next.js dev server

type RegisterAgentRequest = {
  agentId: string;
  activityName?: string;
  llm?: string;
  prompt?: string;
  description?: string;
  createdBy?: string;
  systemRole?: string;
};

app.post(
  '/agents/register',
  async (req: Request<{}, {}, RegisterAgentRequest>, res: Response) => {
    const { agentId, activityName, llm, prompt, description, createdBy, systemRole } = req.body;

    if (!agentId) {
      res.status(400).json({ error: 'agentId is required' });
      return
    }

    try {
      const result = await scaffoldAgentFromApi({
        agentId,
        activityName,
        llm,
        prompt,
        description,
        createdBy,
        systemRole
      });

      res.status(200).json({
        message: 'Agent registered and worker started',
        result
      });

      return;

    } catch (err) {
      console.error('❌ Error during agent creation:', err);
      res.status(500).json({ error: 'Agent creation failed' });
      return
    }
  }
);

app.get('/flows', async (req, res) => {
    const db = await getMongoDb();
    const flows = await db.collection('flows').find().toArray();
    res.json(flows);
});

// ✅ This is the correct export (for serverless or tests)
export default app;

// ✅ Or run the server directly
if (require.main === module) {
  app.listen(3000, () => {
    console.log('🚀 Agent API listening on http://localhost:3000');
  });
}
