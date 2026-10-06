import assert from "node:assert/strict";
import test from "node:test";
import { resolveAgentBridge, createExecutionTarget } from "../runtime/actionworkself-agentbridge.mjs";

const tree = {
  root: { node_id: "ADDR-192-168-12-112", kind: "NETWORK_ENDPOINT", address: "192.168.12.112", parent_id: null, children: ["A1","A2"] },
  nodes: [
    { node_id: "A1", kind: "AGENTBRIDGE_ENDPOINT", address: "http://192.168.12.112:3000/mcpAGENTBRIDGE01", parent_id: "ADDR-192-168-12-112", children: [] },
    { node_id: "A2", kind: "AGENTBRIDGE_ENDPOINT", address: "http://192.168.12.112:11434/v1/modelAGENTBRIDGE02", parent_id: "ADDR-192-168-12-112", children: [] }
  ]
};

test("AGENTBRIDGE resolution is canonical-address based", () => {
  assert.equal(resolveAgentBridge(tree, "AGENTBRIDGE01").address_node_id, "ADDR-192-168-12-112-3000-mcpAGENTBRIDGE01");
  assert.equal(resolveAgentBridge(tree, "AGENTBRIDGE02").address_node_id, "ADDR-192-168-12-112-11434-v1-modelAGENTBRIDGE02");
});

test("execution target references AddressSelf rather than duplicating topology", () => {
  const target = createExecutionTarget(tree, "AGENTBRIDGE02", { action_id: "ACTION-01" });
  assert.equal(target.address_resolution, "ADDRESSSELF_CANONICAL");
  assert.equal(target.action_id, "ACTION-01");
});
