import { AgentConfig } from '../models/AgentConfig';
import { getMongoDb } from './mongoClient';

export async function getAgentConfig(agentId: string): Promise<AgentConfig | null> {
  const db = await getMongoDb();
  return db.collection<AgentConfig>('agent_configs').findOne({ agentId });
}

export async function listAgentConfigs(): Promise<AgentConfig[]> {
  const db = await getMongoDb();
  return db.collection<AgentConfig>('agent_configs').find().toArray();
}

export async function saveAgentConfig(config: AgentConfig) {
  const db = await getMongoDb();
  await db.collection<AgentConfig>('agent_configs').updateOne(
    { agentId: config.agentId },
    { $set: config },
    { upsert: true }
  );
}