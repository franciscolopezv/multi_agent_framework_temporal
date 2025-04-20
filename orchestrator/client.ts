import { Client, Connection } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';
import { dynamicOrchestrator } from './workflows/dynamic-orchestrator.workflow';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const initialRequest = {
    idea: "Create an event-driven app in Kubernetes using Kafka"
  };

  const flow = [
    {
      agent: 'app_designer',
      taskQueue: 'app-designer',
      activityName: 'designApp',
      inputKey: 'initialRequest'
    },
    {
      agent: 'terraform',
      taskQueue: 'terraform-agent',
      activityName: 'generateTerraform',
      input: "{{ app_designer.output.design }}"
    },
    {
      parallel: true,
      steps: [
        {
          agent: 'security_checker',
          taskQueue: 'security-agent',
          activityName: 'checkSecurity',
          input: "{{ terraform.output }}"
        },
        {
          agent: 'cost_estimator',
          taskQueue: 'cost-agent',
          activityName: 'estimateCost',
          input: "{{ terraform.output }}"
        }
      ]
    },
    {
        condition: "{{ security_checker.output.confidenceScore }} < 0.7 || {{ cost_estimator.output.monthlyCost }} > 10000",
        agent: 'manual_approval',
        waitForSignal: 'userApproval',
        input: "Manual approval is required."
      }
  ];  
  

  const handle = await client.workflow.start(dynamicOrchestrator, {
    args: [flow, initialRequest],
    workflowId: `flow-${uuidv4()}`,
    taskQueue: 'app-designer', // this is where the workflow starts — not the first activity
    // searchAttributes: { customKeywordField: ['multi-agent-flow'] }
  });

  const result = await handle.result();
  console.log('🎉 Workflow Result:', JSON.stringify(result, null, 2));
}

run();
