import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const HOST = process.env.OURSELF_SERVER_BIND_HOST || "0.0.0.0";
const PORT = Number(process.env.OURSELF_SERVER_PORT || "3000");
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

// BOOTSTRAP: Load configuration from Repository Artifacts
const REPO_ROOT = "/Users/millysituated/OURSELF";
const PATHS_FILE = path.join(REPO_ROOT, "FLOWACTIONSELFWORK/runtime/ourself-ecosystem-paths.json");

let config = { model_target: "qwen27b-local" };
try {
  config = JSON.parse(fs.readFileSync(PATHS_FILE, "utf8"));
} catch (e) {
  console.error(JSON.stringify({ event: "CONFIG_LOAD_ERROR", error: e.message }));
}

const OURSELF_MODEL = process.env.OURSELF_MODEL || config.model_target;
const MCP_PROTOCOL_VERSION = process.env.MCP_PROTOCOL_VERSION || "2025-06-18";

// CRYPTOGRAPHIC BINDING: Resolve exact commit hashes of the 3-repo spine
const getRepoHash = (repoDir) => {
  try {
    return execSync(`git -C ${path.join(REPO_ROOT, repoDir)} rev-parse HEAD`, { encoding: "utf8" }).trim();
  } catch (e) {
    return "UNRESOLVED";
  }
};

const bootBinding = {
  timestamp: new Date().toISOString(),
  address_repo: getRepoHash("SELFVEREIGN-ADDRESSELF"),
  execution_repo: getRepoHash("FLOWACTIONSELFWORK"),
  cognition_repo: getRepoHash("Cognitive-Transmutation-Core"),
  network_repo: getRepoHash("ourself-cloud-server-network"),
  core_repo: getRepoHash("ourself-core"),
  runtime_model: OURSELF_MODEL
};

console.log(JSON.stringify({ event: "OURSELF_BOOT_BINDING", binding: bootBinding }));


const sessions = new Set();
const tools = [
  { name: "ourself_health", description: "Return OURSELF server state.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "ourself_model_inference", description: "Route inference through OURSELF model authority to local Ollama substrate.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"], additionalProperties: false } }
];

async function ollama(path, init = {}) {
  const response = await fetch(OLLAMA_BASE_URL + path, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function dispatch(message) {
  if (message.method === "initialize") {
    const sessionId = crypto.randomUUID();
    sessions.add(sessionId);
    return {
      response: {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "OURSELF-MCP-MODEL-SERVER", version: "0.1.0" }
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

    if (name === "ourself_health") {
      return {
        response: {
          jsonrpc: "2.0", id: message.id,
          result: { content: [{ type: "text", text: JSON.stringify({
            server: "OURSELF-MCP-MODEL-SERVER",
            status: "LISTENING",
            model_authority: "OURSELF_MODEL_ROUTER",
            model_substrate: "OLLAMA",
            model: OURSELF_MODEL,
            ollama_base_url: OLLAMA_BASE_URL,
            active_sessions: sessions.size
          }) }] }
        }
      };
    }

    if (name === "ourself_model_inference") {
      if (typeof args.prompt !== "string" || !args.prompt.length) throw new Error("MODEL_PROMPT_REQUIRED");
      const result = await ollama("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: OURSELF_MODEL, prompt: args.prompt, stream: false })
      });
      return { response: {
        jsonrpc: "2.0", id: message.id,
        result: { content: [{ type: "text", text: result.response ?? "" }] }
      }};
    }
  }

  return { response: { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "METHOD_NOT_FOUND" } } };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ server: "OURSELF-MCP-MODEL-SERVER", status: "LISTENING", model_router: "OURSELF", model_substrate: "OLLAMA" }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/mcp") {
    res.writeHead(404);
    res.end("NOT_FOUND");
    return;
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
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: error.message } }));
  }
});

server.listen(PORT, HOST, () => console.log(JSON.stringify({
  event: "OURSELF_MCP_MODEL_SERVER_LISTENING",
  bind_host: HOST, port: PORT, endpoint: `http://${HOST}:${PORT}/mcp`,
  model: OURSELF_MODEL, model_substrate: "OLLAMA"
})));
