import { getAgentInfo } from './agentRegistry';

export async function resolveTaskQueuesFromRegistry(flowSteps: any[]): Promise<any[]> {
  const steps = [];

  for (const step of flowSteps) {
    // Parallel block?
    if (step.parallel && Array.isArray(step.steps)) {
      const resolvedSubSteps = await Promise.all(
        step.steps.map(async (subStep: { taskQueue: any; agent: string; }) => ({
          ...subStep,
          taskQueue: subStep.taskQueue || (await getAgentInfo(subStep.agent)).taskQueue
        }))
      );
      steps.push({ parallel: true, steps: resolvedSubSteps });
    } else {
      // Single step
      const agent = await getAgentInfo(step.agent);
      steps.push({
        ...step,
        taskQueue: step.taskQueue || agent.taskQueue
      });
    }
  }

  return steps;
}
