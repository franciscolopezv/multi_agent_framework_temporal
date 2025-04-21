import { NativeConnection, Worker } from '@temporalio/worker';
import fs from 'fs';

async function run() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || 'localhost:7233';
  
  const connection = await NativeConnection.connect({
    address: temporalAddress,
    tls: {
      clientCertPair: {
        crt: fs.readFileSync('/etc/certs/client.crt'),
        key: fs.readFileSync('/etc/certs/client.key'),
      }
    },
  });

  const worker = await Worker.create({
    connection,
    namespace: temporalNamespace,
    workflowsPath: require.resolve('./workflows/dynamic-orchestrator.workflow.ts'),
    taskQueue: 'orchestrator'
  });

  await worker.run();
}

run().catch((err) => {
  console.error('❌ Failed to start orchestrator worker:', err);
  process.exit(1);
});
