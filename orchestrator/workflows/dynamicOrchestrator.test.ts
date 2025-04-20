import { dynamicOrchestrator, resolveInputForStep } from './dynamic-orchestrator.workflow';

jest.mock('@temporalio/workflow', () => {
  const actual = jest.requireActual('@temporalio/workflow');

  let signalValue: any = undefined;

  return {
    ...actual,
    defineSignal: jest.fn((name) => `signal:${name}`),
    setHandler: jest.fn((_signal, handler) => {
      // Simulate the signal being sent later
      setTimeout(() => {
        signalValue = { decision: 'approved' };
        handler(signalValue);
      }, 0);
    }),
    condition: jest.fn(() => Promise.resolve(true)),
    proxyActivities: jest.fn(() => ({
    designApp: jest.fn().mockResolvedValue({ design: 'app.yaml' }),
    generateTerraform: jest.fn().mockResolvedValue({ tf: 'infra.tf' }),
    checkSecurity: jest.fn().mockResolvedValue({ confidenceScore: 0.5 }),
    estimateCost: jest.fn().mockResolvedValue({ monthlyCost: 12000 }),
    approveTask: jest.fn().mockResolvedValue({ approved: true })
  })),
}});

describe('dynamicOrchestrator', () => {
  it('executes with different input types', async () => {
    const steps = [
      {
        agent: 'app_designer',
        taskQueue: 'app_designer',
        activityName: 'designApp',
        inputKey: 'initialRequest'
      },
      {
        agent: 'terraform',
        taskQueue: 'terraform',
        activityName: 'generateTerraform',
        input: {
          idea: '{{ initialRequest.idea }}',
          design: '{{ app_designer.output.result }}'
        }
      },
      {
        parallel: true,
        steps: [
          {
            agent: 'security_checker',
            taskQueue: 'security_checker',
            activityName: 'checkSecurity',
            input: {
              idea: '{{ initialRequest.idea }}',
              design: '{{ terraform.output.tf }}'
            }
          },
          {
            agent: 'cost_estimator',
            taskQueue: 'cost_estimator',
            activityName: 'estimateCost',
            input: {
              idea: '{{ initialRequest.idea }}',
              design: '{{ terraform.output.tf }}'
            }
          }
        ]
      },
      {
        condition: '{{ security_checker.output.confidenceScore }} < 0.7 || {{ cost_estimator.output.monthlyCost }} > 10000',
        agent: 'manual_approval',
        taskQueue: 'manual_approval',
        waitForSignal: "userApproval",
        activityName: 'manualReview',
        input: 'Manual approval required'
      }
    ];

    const input = { idea: 'Build a Kafka app' };

    const result = await dynamicOrchestrator(steps, input);

    expect(result).toMatchObject({
      initialRequest: input,
      app_designer: { output: { design: 'app.yaml' } },
      terraform: { output: { tf: 'infra.tf' } },
      security_checker: { output: { confidenceScore: 0.5 } },
      cost_estimator: { output: { monthlyCost: 12000 } },
    });
  });

  it('handles multiline string values in object template input', async () => {
    const steps = [
      {
        agent: 'summarizer',
        taskQueue: 'summarizer',
        activityName: 'summarize',
        input: {
          idea: '{{ initialRequest.idea }}',
          design: '{{ app_designer.output.result }}'
        }
      }
    ];
  
    const input = { idea: 'Kafka streaming for AI' };
    const context = {
      initialRequest: input,
      app_designer: {
        output: {
          result: `An AI-driven Kafka platform would be a system that leverages...\n\n1. Ingest data\n2. AI decisions`
        }
      }
    };
  
    const resolved = resolveInputForStep(steps[0], context);
  
    expect(resolved.design).toContain('AI-driven Kafka');
    expect(resolved.idea).toBe('Kafka streaming for AI');
  });

  it('skips conditional step if required field is missing', async () => {
    const steps = [
      {
        agent: 'security_checker',
        taskQueue: 'security_checker',
        activityName: 'checkSecurity',
        input: { idea: '{{ initialRequest.idea }}' }
      }
    ];
    
    const input = { idea: 'Secure Kafka architecture' };
    
    const result = await dynamicOrchestrator(steps, input);
    
    expect(result.manual_approval).toBeUndefined(); // Will only be added if confidenceScore < 0.7
  });

  it('executes conditional step when condition evaluates to true', async () => {
    const steps = [
      {
        agent: 'security_checker',
        taskQueue: 'security_checker',
        activityName: 'checkSecurity',
        input: { idea: '{{ initialRequest.idea }}' }
      },
      {
        agent: 'manual_approval',
        activityName: 'approve',
        taskQueue: 'manual_approval',
        waitForSignal: "userApproval",
        condition: '{{ security_checker.output.confidenceScore }} < 0.7',
        input: 'Manual approval needed'
      }
    ];
  
    const input = { idea: 'Secure Kafka architecture' };
    const context = {
      initialRequest: input,
      security_checker: {
        output: {
          confidenceScore: 0.5
        }
      }
    };
  
    const result = await dynamicOrchestrator(steps, input);
  
    expect(result.manual_approval).toBeDefined();
  });

  it('executes conditional step when condition evaluates to false', async () => {
    const steps = [
      {
        agent: 'security_checker',
        taskQueue: 'security_checker',
        activityName: 'checkSecurity',
        input: { idea: '{{ initialRequest.idea }}' }
      },
      {
        agent: 'manual_approval',
        activityName: 'approve',
        taskQueue: 'manual_approval',
        waitForSignal: "userApproval",
        condition: '{{ security_checker.output.confidenceScore }} < 0.2',
        input: 'Manual approval needed'
      }
    ];
  
    const input = { idea: 'Secure Kafka architecture' };
    const context = {
      initialRequest: input,
      security_checker: {
        output: {
          confidenceScore: 0.5
        }
      }
    };
  
    const result = await dynamicOrchestrator(steps, input);
  
    expect(result.manual_approval).toBeUndefined();
  });
  
  
});


