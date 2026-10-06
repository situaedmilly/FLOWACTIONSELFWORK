# ActionWorkSelf ↔ AGENTBRIDGE Witness v0.1

ActionWorkSelf consumes the AddressSelf registry as its canonical pointer surface.

The two AGENTBRIDGE bindings are:

- AGENTBRIDGE01 → `ADDR-192-168-12-112-3000-mcpAGENTBRIDGE01`
- AGENTBRIDGE02 → `ADDR-192-168-12-112-11434-v1-modelAGENTBRIDGE02`

ActionWorkSelf MUST resolve the AddressSelf node before producing an execution target. It MUST NOT maintain a competing endpoint registry.

`createExecutionTarget()` therefore emits an action object carrying `address_node_id`, not a second topology definition.

State remains evidence-backed: AGENTBRIDGE01 is not declared live; AGENTBRIDGE02 is observed live.
