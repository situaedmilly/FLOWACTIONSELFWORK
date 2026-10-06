import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createSelfThought, verifyThoughtBytes } from "/Users/millysituated/OURSELF/Cognitive-Transmutation-Core/src/selfthought.mjs";

const HOST = process.env.OURSELF_SERVER_BIND_HOST || "0.0.0.0";
const PORT = Number(process.env.OURSELF_SERVER_PORT || "3000");
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const REPO_ROOT = "/Users/millysituated/OURSELF";
const PATHS_FILE = path.join(REPO_ROOT, "FLOWACTIONSELFWORK/runtime/ourself-ecosystem-paths.json");

let config = {};
try { config = JSON.parse(fs.readFileSync(PATHS_FILE, "utf8")); }
catch (e) { console.error(JSON.stringify({ event: "CONFIG_LOAD_ERROR", error: e.message })); }

const launch = config.launch_realm || {};
const OURSELF_MODEL =
  process.env.OURSELF_MODEL ||
  config.canonical_server?.model_target ||
  "qwen27b-local";
const MCP_PROTOCOL_VERSION = process.env.MCP_PROTOCOL_VERSION || "2025-06-18";
const INSTANCE_ID = config.canonical_server?.instance_id || "OURSELF-INSTANCE-0001";
const REALITY_ID = "SELFTELLIGENCE-BOOT-0001";
const SERVER_ID = config.canonical_server?.server_id || "OURSELF-MCP-MODEL-SERVER";

const getRepoHash = repoDir => {
  try { return execSync(`git -C ${path.join(REPO_ROOT, repoDir)} rev-parse HEAD`, { encoding: "utf8" }).trim(); }
  catch { return "UNRESOLVED"; }
};

const bootBinding = {
  timestamp: new Date().toISOString(),
  address_repo: getRepoHash("SELFVEREIGN-ADDRESSELF"),
  execution_repo: getRepoHash("FLOWACTIONSELFWORK"),
  cognition_repo: getRepoHash("Cognitive-Transmutation-Core"),
  network_repo: getRepoHash("ourself-cloud-server-network"),
  core_repo: getRepoHash("ourself-core"),
  runtime_model: OURSELF_MODEL,
  server: SERVER_ID,
  reality: REALITY_ID
};
console.log(JSON.stringify({ event: "OURSELF_BOOT_BINDING", binding: bootBinding }));

const sessions = new Map();
const receipts = [];

const tools = [
  {
    name: "ourself_health",
    description: "Return OURSELF cognitive server state.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "ourself_selftell",
    description: "Instantiate SELFTELLIGENCE, route through MODELSELF, create immutable SELFTHOUGHT, and record its cognitive receipt.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", minLength: 1 },
        causal_parent: { type: ["string", "null"] }
      },
      required: ["prompt"]
    }
  },
  {
    name: "ourself_model_inference",
    description: "Compatibility surface. Inference is now governed by SELFTELLIGENCE.",
    inputSchema: {
      type: "object",
      properties: { prompt: { type: "string", minLength: 1 } },
      required: ["prompt"]
    }
  }
];

async function ollama(route, init = {}) {
  const response = await fetch(OLLAMA_BASE_URL + route, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function selfTell(sessionId, prompt, causalParent = null) {
  const intelligenceId = "SELFTELLIGENCE-" + crypto.randomUUID();
  const actimanirunId = "ACTIMANIRUN-" + crypto.randomUUID();
  const thoughtBirthId = "BIRTH-" + crypto.randomUUID();

  const modelResult = await ollama("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: OURSELF_MODEL,
      prompt,
      stream: false
    })
  });

  const output = typeof modelResult.response === "string" ? modelResult.response : "";
  if (!output.length) throw new Error("COGNITIVE_OUTPUT_EMPTY");

  const thought = createSelfThought({
    thoughtId: "THOUGHT-" + crypto.randomUUID(),
    thoughtBirthId,
    originInstanceId: INSTANCE_ID,
    originSessionId: sessionId,
    originActimanirunId: actimanirunId,
    originRealityId: REALITY_ID,
    thought: output,
    causalParent,
    relation: "COGNITIVE_ACT",
    gate: { id: "SELFTELLIGENCE-BOOT-0001", required: true, status: "PASSED" }
  });

  if (!verifyThoughtBytes(thought)) throw new Error("SELFTHOUGHT_BYTE_INTEGRITY_FAILURE");

  const receipt = {
    receipt_id: "COGNITIVE-ACT-" + crypto.randomUUID(),
    intelligence_id: intelligenceId,
    thought_id: thought.thought_id,
    instance_id: INSTANCE_ID,
    session_id: sessionId,
    actimanirun_id: actimanirunId,
    reality_id: REALITY_ID,
    model_ref: OURSELF_MODEL,
    cognition_authority: "OURSELF",
    cognition_substrate: "OLLAMA",
    artifact: "SELFTHOUGHT",
    thought_hash: thought.thought_hash,
    status: "RECORDED",
    created_at: new Date().toISOString()
  };
  receipts.push(receipt);

  return { intelligence_id: intelligenceId, model: OURSELF_MODEL, selfthought: thought, receipt };
}

async function dispatch(message) {
  if (message.method === "initialize") {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { initialized_at: new Date().toISOString() });
    return {
      response: {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_ID, version: "0.2.0-SELFTELLIGENCE" }
        }
      },
      sessionId
    };
  }

  if (message.method === "notifications/initialized") return { response: null };

  if (message.method === "tools/list") {
    return { response: { jsonrpc: "2.0", id: message.id, result: { tools } } };
  }

  if (message.method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments || {};
    const sessionId = message.params?.sessionId || "MCP-SESSION-UNBOUND";

    if (name === "ourself_health") {
      return {
        response: {
          jsonrpc: "2.0", id: message.id,
          result: { content: [{ type: "text", text: JSON.stringify({
            server: SERVER_ID,
            reality: REALITY_ID,
            status: "LISTENING",
            cognitive_layer: "SELFTELLIGENCE",
            model_authority: "OURSELF_MODEL_ROUTER",
            model_substrate: "OLLAMA",
            model: OURSELF_MODEL,
            selfthought_runtime: "Cognitive-Transmutation-Core/src/selfthought.mjs",
            active_sessions: sessions.size,
            receipts: receipts.length
          }) }] }
        }
      };
    }

    if (name === "ourself_selftell" || name === "ourself_model_inference") {
      if (typeof args.prompt !== "string" || !args.prompt.length) throw new Error("COGNITIVE_PROMPT_REQUIRED");
      const result = await selfTell(sessionId, args.prompt, args.causal_parent ?? null);
      return {
        response: {
          jsonrpc: "2.0",
          id: message.id,
          result: { content: [{ type: "text", text: JSON.stringify(result) }] }
        }
      };
    }
  }

  return { response: { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "METHOD_NOT_FOUND" } } };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      server: SERVER_ID,
      reality: REALITY_ID,
      status: "LISTENING",
      cognitive_layer: "SELFTELLIGENCE",
      model_router: "OURSELF",
      model_substrate: "OLLAMA",
      model: OURSELF_MODEL
    }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/mcp") {
    res.writeHead(404); res.end("NOT_FOUND"); return;
  }

  const sessionId = req.headers["mcp-session-id"];
  if (sessionId && !sessions.has(sessionId)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "UNKNOWN_MCP_SESSION" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;

  try {
    const result = await dispatch(JSON.parse(body));
    if (!result.response) { res.writeHead(202); res.end(); return; }
    res.writeHead(200, {
      "content-type": "application/json",
      "mcp-session-id": result.sessionId || sessionId || ""
    });
    res.end(JSON.stringify(result.response));
  } catch (error) {
    console.error(JSON.stringify({ event: "SELFTELLIGENCE_FAILURE", error: error.message }));
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: error.message } }));
  }
});

server.listen(PORT, HOST, () => console.log(JSON.stringify({
  event: "OURSELF_SELFTELLIGENCE_SERVER_LISTENING",
  bind_host: HOST,
  port: PORT,
  endpoint: `http://${HOST}:${PORT}/mcp`,
  model: OURSELF_MODEL,
  cognitive_layer: "SELFTELLIGENCE",
  reality: REALITY_ID
})));
