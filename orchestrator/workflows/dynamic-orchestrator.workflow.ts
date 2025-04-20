import {
    condition,
    defineSignal,
    proxyActivities,
    setHandler
} from '@temporalio/workflow';
import handlebars from 'handlebars';

type FlowStep = {
  agent: string;
  taskQueue: string;
  activityName: string;
  inputKey?: string;
  input?: any;
};

export async function dynamicOrchestrator(flowSteps: any[], initialInput: any): Promise<any> {
    const context: Record<string, any> = {
      initialRequest: initialInput
    };
  
    for (const step of flowSteps) {
      // === Handle parallel steps ===
      if (step.parallel && Array.isArray(step.steps)) {
        console.log("🧵 Executing parallel step group...");
        await Promise.all(step.steps.map(async (parallelStep: { taskQueue: any; activityName: any; agent: any; inputKey?: string | undefined; input?: any; }) => {
          const activity = proxyActivities({
            taskQueue: parallelStep.taskQueue,
            startToCloseTimeout: '10 minutes',
          });
          const input = resolveInputForStep(parallelStep, context);
          const result = await activity[parallelStep.activityName](input);
          context[parallelStep.agent] = { output: result };
        }));
        continue;
      }
  
      // === Handle conditional step ===
      if (step.condition) {
        const shouldRun = evaluateCondition(step.condition, context);
        if (!shouldRun) {
          console.log(`⛔️ Skipping ${step.agent} due to condition: ${step.condition}`);
          continue;
        }
      }
      
      // === Handle signal-waiting step ===
      if (step.waitForSignal) {
        console.log(`⏸ Waiting for signal: ${step.waitForSignal}`);

        const signalName = step.waitForSignal;
        let signalValue: any;

        const signal = defineSignal<[any]>(signalName);

        setHandler(signal, (payload) => {
            console.log(`📬 Received signal: ${signalName}`, payload);
            signalValue = payload;
        });

        console.log(`⏸ Waiting for signal: ${signalName}...`);

        await condition(() => signalValue !== undefined);

        context[step.agent] = { output: signalValue };

        console.log(`📦 Context after signal ${step.agent}:`, JSON.stringify(context, null, 2));
        continue;
      }

      // === Handle normal step ===
      const activity = proxyActivities({
        taskQueue: step.taskQueue,
        startToCloseTimeout: '10 minutes',
      });
  
      const input = resolveInputForStep(step, context);
      console.log(`➡️ Input for ${step.agent}:`, input);
      console.log(`➡️ Activity Name: ${activity[step.activityName]}`);
      const result = await activity[step.activityName](input);
      context[step.agent] = { output: result };
  
      console.log(`📦 Context after ${step.agent}:`, JSON.stringify(context, null, 2));
    }
  
    return context;
  }

  function evaluateCondition(expression: string, context: any): boolean {
    try {
      const interpolated = expression.replace(/\{\{(.+?)\}\}/g, (_, path) => {
        const value = getValueFromPath(context, path.trim());
        return typeof value === 'undefined' ? 'undefined' : JSON.stringify(value);
      });
  
      // Don’t allow dangerous expressions like eval("true || process.exit()")
      if (/[^a-zA-Z0-9\s()<>=!&|.+\-*/"'`:]/.test(interpolated)) {
        throw new Error(`Unsafe characters in condition: "${expression}"`);
      }
  
      return eval(interpolated); // ⚠️ Safe only with controlled expressions
    } catch (err) {
      console.warn(`⚠️ Condition evaluation failed for "${expression}"`, err);
      return false;
    }
  }  

 export function resolveInputForStep(step: FlowStep, context: any): any {
    if (step.inputKey) {
      return getValueFromPath(context, step.inputKey);
    }
  
    if (typeof step.input === 'function') {
      return step.input(context); // callable input
    }
  
    if (typeof step.input === 'string') {
      const compiled = handlebars.compile(step.input);
      return compiled(context);
    }
  
    if (typeof step.input === 'object' && step.input !== null) {
        const resolved: Record<string, any> = {};

        for (const [key, value] of Object.entries(step.input)) {
          if (typeof value === 'string') {
            const compiled = handlebars.compile(value);
            resolved[key] = compiled(context);
          } else {
            resolved[key] = value; // non-string values passed through
          }
        }
      
        return resolved;
    }
  
    return step.input; // fallback (null or undefined)
  }

function getValueFromPath(context: any, path: string): any {
    try {
      if (context.hasOwnProperty(path)) {
        return context[path];
      }
      return path.split('.').reduce((acc, key) => acc?.[key], context);
    } catch (err) {
      console.warn(`⚠️ Could not resolve path: ${path}`);
      return undefined;
    }
  }
  
  

function interpolateTemplate(template: string, context: any): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const val = getValueFromPath(context, path.trim());
    return typeof val === 'string' ? val : JSON.stringify(val);
  });
}

