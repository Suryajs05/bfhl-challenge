// app/api/bfhl/route.js
import { NextResponse } from "next/server";

// ── Identity ──────────────────────────────────────────────────────────────────
const USER_ID = "suryajayeshsubha_29052005"; 
const EMAIL_ID = "sj6260@srmist.edu.in";     
const COLLEGE_ROLL_NUMBER = "RA2311047010119";

// ── CORS helper ───────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── Validation ────────────────────────────────────────────────────────────────
const NODE_PATTERN = /^[A-Z]->[A-Z]$/;

function classifyEntries(data) {
  const validEdges = [];      // { parent, child, raw }
  const invalidEntries = [];
  const seenEdges = new Set();
  const duplicateEdges = [];

  for (const raw of data) {
    const trimmed = typeof raw === "string" ? raw.trim() : String(raw).trim();

    // Basic pattern check: must be exactly "X->Y"
    if (!NODE_PATTERN.test(trimmed)) {
      invalidEntries.push(trimmed);
      continue;
    }

    const [parent, child] = trimmed.split("->");

    // Self-loop is invalid
    if (parent === child) {
      invalidEntries.push(trimmed);
      continue;
    }

    // Duplicate detection
    if (seenEdges.has(trimmed)) {
      if (!duplicateEdges.includes(trimmed)) {
        duplicateEdges.push(trimmed);
      }
      continue;
    }

    seenEdges.add(trimmed);
    validEdges.push({ parent, child, raw: trimmed });
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

// ── Graph Building ────────────────────────────────────────────────────────────
function buildGraph(validEdges) {
  // children adjacency: node -> [child, ...]
  const children = {};  // Map<string, string[]>
  // parents adjacency: node -> string (first parent, multi-parent rule)
  const parentOf = {};  // Map<string, string>
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    // Multi-parent rule: first-encountered parent wins
    if (parentOf[child] !== undefined) {
      // silently discard — child already has a parent
      continue;
    }

    parentOf[child] = parent;

    if (!children[parent]) children[parent] = [];
    children[parent].push(child);
  }

  return { children, parentOf, allNodes };
}

// ── Connected Components ──────────────────────────────────────────────────────
function getComponents(allNodes, children, parentOf) {
  const visited = new Set();
  const components = [];

  // Build full adjacency (undirected) for component grouping
  const adj = {};
  for (const node of allNodes) adj[node] = new Set();
  for (const [parent, childs] of Object.entries(children)) {
    for (const child of childs) {
      adj[parent].add(child);
      adj[child].add(parent);
    }
  }

  for (const node of allNodes) {
    if (visited.has(node)) continue;
    // BFS
    const component = new Set();
    const queue = [node];
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      component.add(cur);
      for (const nb of (adj[cur] || [])) {
        if (!visited.has(nb)) queue.push(nb);
      }
    }
    components.push(component);
  }

  return components;
}

// ── Cycle Detection (DFS on directed graph) ───────────────────────────────────
function hasCycle(nodes, children) {
  // 0=unvisited, 1=in-stack, 2=done
  const state = {};
  for (const n of nodes) state[n] = 0;

  function dfs(node) {
    state[node] = 1;
    for (const child of (children[node] || [])) {
      if (state[child] === 1) return true;  // back edge → cycle
      if (state[child] === 0 && dfs(child)) return true;
    }
    state[node] = 2;
    return false;
  }

  for (const n of nodes) {
    if (state[n] === 0 && dfs(n)) return true;
  }
  return false;
}

// ── Tree Builder (recursive nested object) ────────────────────────────────────
function buildTree(node, children) {
  const obj = {};
  for (const child of (children[node] || [])) {
    obj[child] = buildTree(child, children);
  }
  return obj;
}

// ── Depth Calculation ─────────────────────────────────────────────────────────
function calcDepth(node, children, memo = {}) {
  if (memo[node] !== undefined) return memo[node];
  const childs = children[node] || [];
  if (childs.length === 0) {
    memo[node] = 1;
    return 1;
  }
  const depth = 1 + Math.max(...childs.map((c) => calcDepth(c, children, memo)));
  memo[node] = depth;
  return depth;
}

// ── Main Processing ───────────────────────────────────────────────────────────
function processData(data) {
  const { validEdges, invalidEntries, duplicateEdges } = classifyEntries(data);
  const { children, parentOf, allNodes } = buildGraph(validEdges);
  const components = getComponents(allNodes, children, parentOf);

  const hierarchies = [];

  for (const component of components) {
    const nodes = [...component];
    const cyclic = hasCycle(nodes, children);

    // Find roots: nodes with no parent in THIS component
    const roots = nodes.filter((n) => parentOf[n] === undefined);

    if (cyclic) {
      // Pure cycle: all nodes appear as children → no root found
      // Use lexicographically smallest node as root
      const root = roots.length > 0 ? roots.sort()[0] : nodes.sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      // Non-cyclic: may have one or more roots (disconnected forest within component — shouldn't happen,
      // but handle gracefully by sorting and using first)
      const root = roots.sort()[0];
      const tree = { [root]: buildTree(root, children) };
      const depth = calcDepth(root, children);
      hierarchies.push({ root, tree, depth });
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  const cyclic = hierarchies.filter((h) => h.has_cycle);

  let largest_tree_root = "";
  if (nonCyclic.length > 0) {
    // Find max depth, tiebreak lexicographically
    const sorted = [...nonCyclic].sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root.localeCompare(b.root);
    });
    largest_tree_root = sorted[0].root;
  }

  const summary = {
    total_trees: nonCyclic.length,
    total_cycles: cyclic.length,
    largest_tree_root,
  };

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  };
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: 'Request body must be JSON with a "data" array.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = processData(body.data);
    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON or server error.", detail: err.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}