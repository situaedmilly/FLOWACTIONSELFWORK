import { whereIs, resolve } from "./actionworkself-address.mjs";

export const AGENTBRIDGE_ENDPOINTS = Object.freeze({
  AGENTBRIDGE01: Object.freeze({
    agentbridge_id: "AGENTBRIDGE01",
    address_node_id: "ADDR-192-168-12-112-3000-mcpAGENTBRIDGE01",
    address: "http://192.168.12.112:3000/mcpAGENTBRIDGE01",
    expected_state: "NOT_DECLARED_LIVE"
  }),
  AGENTBRIDGE02: Object.freeze({
    agentbridge_id: "AGENTBRIDGE02",
    address_node_id: "ADDR-192-168-12-112-11434-v1-modelAGENTBRIDGE02",
    address: "http://192.168.12.112:11434/v1/modelAGENTBRIDGE02",
    expected_state: "OBSERVED_LIVE"
  })
});

export function resolveAgentBridge(tree, agentbridgeId) {
  const binding = AGENTBRIDGE_ENDPOINTS[agentbridgeId];
  if (!binding) throw new Error("AGENTBRIDGE_NOT_FOUND");
  const node = whereIs(tree, binding.address_node_id) ?? resolve(tree, binding.address);
  if (!node) throw new Error("ADDRESS_NODE_NOT_FOUND");
  if (node.node_id !== binding.address_node_id) throw new Error("ADDRESS_ID_MISMATCH");
  return Object.freeze({ ...binding, resolved_node: node });
}

export function createExecutionTarget(tree, agentbridgeId, actionNode) {
  const binding = resolveAgentBridge(tree, agentbridgeId);
  return Object.freeze({
    ...actionNode,
    kind: "EXECUTION_TARGET",
    agentbridge_id: agentbridgeId,
    address_node_id: binding.address_node_id,
    address: binding.address,
    address_resolution: "ADDRESSSELF_CANONICAL"
  });
}
