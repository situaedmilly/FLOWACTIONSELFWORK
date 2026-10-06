import assert from "node:assert/strict";
import test from "node:test";
import { whereIs, resolve, childrenOf, parentOf, createChild } from "../runtime/actionworkself-address.mjs";

const graph = {
  root: { node_id: "WORK", kind: "WORK_ROOT", address: "actionwork://OURSELF", parent_id: null, children: ["ACTION"] },
  nodes: [{ node_id: "ACTION", kind: "ACTION", address: "action://example", parent_id: "WORK", children: [] }]
};

test("WHERE_IS and RESOLVE are address/node symmetric", () => {
  assert.equal(whereIs(graph, "WORK").address, "actionwork://OURSELF");
  assert.equal(resolve(graph, "action://example").node_id, "ACTION");
});

test("PARENT_OF and CHILDREN_OF are inverse traversal", () => {
  assert.equal(childrenOf(graph, "WORK")[0].node_id, "ACTION");
  assert.equal(parentOf(graph, "ACTION").node_id, "WORK");
});

test("CREATE_CHILD creates an addressable descendant", () => {
  createChild(graph, "ACTION", {
    node_id: "TARGET",
    kind: "EXECUTION_TARGET",
    address: "endpoint://192.168.12.112:3000",
    parent_id: "ACTION"
  });
  assert.equal(resolve(graph, "endpoint://192.168.12.112:3000").node_id, "TARGET");
  assert.equal(parentOf(graph, "TARGET").node_id, "ACTION");
});
