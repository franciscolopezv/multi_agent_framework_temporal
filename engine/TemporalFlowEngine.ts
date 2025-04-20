import { Client } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';
import { dynamicOrchestrator } from '../orchestrator/workflows/dynamic-orchestrator.workflow';
import { FlowEngine } from './FlowEngine';
import { loadFlowDefinition } from './flowRegistry';
import { resolveTaskQueuesFromRegistry } from './resolveTaskQueuesFromRegistry';

export class TemporalFlowEngine implements FlowEngine {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async startFlow(params: {
    flowName: string;
    userInput: any;
    configOverride?: any;
  }): Promise<string> {
    const rawSteps = await loadFlowDefinition(params.flowName);
    const steps = await resolveTaskQueuesFromRegistry(rawSteps);

    const workflowId = `flow-${uuidv4()}`;

    await this.client.workflow.start(dynamicOrchestrator, {
      workflowId,
      taskQueue: 'orchestrator',
      args: [steps, params.userInput]
    });

    return workflowId;
  }

  async signal(workflowId: string, signalName: string, payload: any): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal(signalName, payload);
  }

  async getStatus(workflowId: string): Promise<any> {
    const handle = this.client.workflow.getHandle(workflowId);
  
    try {
      const result = await handle.result();
      const state = await handle.describe();
  
      return {
        status: state.status.name.toLowerCase(),
        result,
        workflowId: state.workflowId,
        runId: state.runId,
        startedAt: state.startTime,
        closedAt: state.closeTime ?? null
      };
    } catch (err) {
      const state = await handle.describe();
      return {
        status: state.status.name.toLowerCase(),
        result: undefined,
        workflowId: state.workflowId,
        runId: state.runId,
        startedAt: state.startTime,
        closedAt: state.closeTime ?? null
      };
    }
  }
  

  async cancel(workflowId: string): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.terminate('Canceled by user');
  }
}
