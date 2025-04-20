import { NativeConnection, Worker } from '@temporalio/worker';

async function run() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  const connection = await NativeConnection.connect({ address: temporalAddress });
  
  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows/dynamic-orchestrator.workflow.ts'),
    taskQueue: 'orchestrator'
  });

  await worker.run();
}

run().catch((err) => {
  console.error('❌ Failed to start orchestrator worker:', err);
  process.exit(1);
});
