import { createExecutionTarget, resolveAgentBridge } from "./actionworkself-agentbridge.mjs";

export const WORKFLOW_STATES = Object.freeze([
  "DECLARED", "RESOLVED", "ADMITTED", "RUN_READY", "OBSERVED", "RECORDED", "STOPPED"
]);

export function createWorkflowRun(tree, { workflow_id, agentbridge_id, action }) {
  if (!workflow_id || !agentbridge_id || !action) throw new Error("INVALID_WORKFLOW_RUN");
  const target = createExecutionTarget(tree, agentbridge_id, action);
  return Object.freeze({
    workflow_id,
    run_id: `RUN-${workflow_id}`,
    primitive: "ACTIONWORKSELF_WORKFLOWRUN",
    state: "RUN_READY",
    target,
    lifecycle: [...WORKFLOW_STATES],
    authority: "INHERITED_FROM_CALLER",
    execution: "NOT_PERFORMED",
    witness_requirement: "ADDRESSSELF_RESOLUTION"
  });
}

export function advanceWorkflowRun(run, observation) {
  if (!run || run.state !== "RUN_READY") throw new Error("WORKFLOW_NOT_RUN_READY");
  return Object.freeze({
    ...run,
    state: "OBSERVED",
    observation: Object.freeze(observation ?? {}),
    next: "RECORD"
  });
}
