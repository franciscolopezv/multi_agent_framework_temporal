import { getMongoDb } from '../db/mongoClient';

export async function loadFlowDefinition(flowName: string): Promise<any[]> {
  const db = await getMongoDb();
  const [name, version = 'v1'] = flowName.split(':');

  const flow = await db.collection('flows').findOne({ name, version });

  if (!flow) throw new Error(`❌ Flow not found: ${flowName}`);
  return flow.steps;
}
