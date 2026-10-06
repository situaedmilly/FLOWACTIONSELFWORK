# ACTIONWORKSELF WorkflowRun / AlchemyMoat v0.1

CHAMBOXREALITY boot state:

`ADDRESSSELF → ACTIONWORKSELF → WORKFLOWRUN → AGENTBRIDGE → OBSERVATION → COGNITIVE WITNESS`

The WorkflowRun primitive is deliberately substrate-neutral. It does not pretend a GitHub Actions runner is the OURSELF execution authority.

## Primitive

`createWorkflowRun(tree, { workflow_id, agentbridge_id, action })`

It:

1. resolves the AGENTBRIDGE through AddressSelf;
2. creates an execution target containing the canonical address node;
3. enters `RUN_READY`;
4. records that execution has not occurred.

`advanceWorkflowRun(run, observation)` transitions a ready run to `OBSERVED`.

## ALCHEMYMOAT

The moat is the boundary around the run:

- pointer resolution is required;
- target identity is canonical;
- execution is not inferred from declaration;
- observation is recorded separately from authority;
- the workflow can be transported to local runtime, BubbleIO, or another executor without changing its target identity.
