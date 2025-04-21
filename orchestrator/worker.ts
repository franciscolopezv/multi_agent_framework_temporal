import { NativeConnection, Worker } from '@temporalio/worker';
import fs from 'fs';

async function run() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  
  const connection = await NativeConnection.connect({
    address: temporalAddress,
    tls: {
      clientCertPair: {
        crt: fs.readFileSync('/etc/ssl/client/client.crt'),
        key: fs.readFileSync('/etc/ssl/client/client.key'),
      }
    },
  });

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
