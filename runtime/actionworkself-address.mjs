import fs from "node:fs/promises";

export const OPERATIONS = Object.freeze([
  "WHERE_IS",
  "RESOLVE",
  "CHILDREN_OF",
  "PARENT_OF",
  "CREATE_CHILD"
]);

export async function loadTree(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function allNodes(tree) {
  return [tree.root, ...(tree.nodes ?? [])];
}

export function whereIs(tree, target) {
  const nodes = allNodes(tree);
  return nodes.find((n) => n.node_id === target || n.address === target) ?? null;
}

export const resolve = whereIs;

export function childrenOf(tree, parentId) {
  return allNodes(tree).filter((n) => n.parent_id === parentId);
}

export function parentOf(tree, nodeId) {
  const node = whereIs(tree, nodeId);
  return node?.parent_id ? whereIs(tree, node.parent_id) : null;
}

export function createChild(tree, parentId, node) {
  const parent = whereIs(tree, parentId);
  if (!parent) throw new Error("PARENT_NOT_FOUND");
  if (!node?.node_id || !node?.address || !node?.kind) {
    throw new Error("INVALID_CHILD_NODE");
  }
  if (node.node_id === tree.root.node_id || whereIs(tree, node.node_id)) {
    throw new Error("NODE_ALREADY_EXISTS");
  }
  if (node.parent_id !== parentId) throw new Error("PARENT_ID_MISMATCH");

  tree.nodes ??= [];
  tree.nodes.push({ children: [], ...node });
  parent.children ??= [];
  parent.children.push(node.node_id);
  return node;
}
