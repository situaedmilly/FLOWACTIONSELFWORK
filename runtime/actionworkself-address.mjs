export const OPERATIONS = Object.freeze([
  "WHERE_IS",
  "RESOLVE",
  "CHILDREN_OF",
  "PARENT_OF",
  "CREATE_CHILD"
]);

export function allNodes(graph) {
  return [graph.root, ...(graph.nodes ?? [])];
}

export function whereIs(graph, target) {
  return allNodes(graph).find((n) => n.node_id === target || n.address === target) ?? null;
}

export const resolve = whereIs;

export function childrenOf(graph, parentId) {
  return allNodes(graph).filter((n) => n.parent_id === parentId);
}

export function parentOf(graph, nodeId) {
  const node = whereIs(graph, nodeId);
  return node?.parent_id ? whereIs(graph, node.parent_id) : null;
}

export function createChild(graph, parentId, node) {
  const parent = whereIs(graph, parentId);
  if (!parent) throw new Error("PARENT_NOT_FOUND");
  if (!node?.node_id || !node?.address || !node?.kind) {
    throw new Error("INVALID_CHILD_NODE");
  }
  if (whereIs(graph, node.node_id)) throw new Error("NODE_ALREADY_EXISTS");
  if (node.parent_id !== parentId) throw new Error("PARENT_ID_MISMATCH");

  graph.nodes ??= [];
  graph.nodes.push({ children: [], ...node });
  parent.children ??= [];
  parent.children.push(node.node_id);
  return node;
}
