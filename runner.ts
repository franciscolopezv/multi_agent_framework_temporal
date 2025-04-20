import { Client, Connection } from '@temporalio/client';
import { TemporalFlowEngine } from './engine/TemporalFlowEngine';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const engine = new TemporalFlowEngine(client);

  const flowId = await engine.startFlow({
    flowName: 'insurance_opportunity:v1',
    userInput: { "text": "I'm 45, with 2 kids. I want a life insurance plan that helps me retire at 60." }
  });

  console.log('✅ Flow started with ID:', flowId);

  const result = await engine.getStatus(flowId);

  console.log('✅ Flow completed with result:', result.result);

  process.exit(0);
}

run();
