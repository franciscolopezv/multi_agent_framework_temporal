export interface FlowEngine {
  startFlow(params: {
    flowName: string;
    userInput: any;
    configOverride?: any;
  }): Promise<string>;

  signal(workflowId: string, signalName: string, payload: any): Promise<void>;

  getStatus(workflowId: string): Promise<{
    status: string;
    result?: any;
    history?: any;
  }>;

  cancel(workflowId: string): Promise<void>;
}
