import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoDir = process.env.GENESIS_REPO_DIR || ".";
const composeFile = join(repoDir, "genesis", "compose.yaml");
const modelDir = process.env.GENESIS_MODEL_DIR;
const modelFile = process.env.GENESIS_MODEL_FILE;
const endpoint = process.env.GENESIS_ENDPOINT || "http://127.0.0.1:8080";

if (!modelDir || !modelFile) {
  throw new Error("GENESIS_MODEL_BINDING_REQUIRED: set GENESIS_MODEL_DIR and GENESIS_MODEL_FILE");
}
const modelPath = join(modelDir, modelFile);
if (!existsSync(modelPath)) throw new Error(`GENESIS_MODEL_NOT_FOUND: ${modelPath}`);
if (!existsSync(composeFile)) throw new Error(`GENESIS_COMPOSE_NOT_FOUND: ${composeFile}`);

const sha256 = createHash("sha256").update(readFileSync(modelPath)).digest("hex");

const env = {
  ...process.env,
  GENESIS_MODEL_DIR: modelDir,
  GENESIS_MODEL_FILE: modelFile
};

execFileSync("docker", ["compose", "-f", composeFile, "up", "-d"], {
  env,
  stdio: "inherit"
});

async function get(path) {
  const response = await fetch(endpoint + path);
  const body = await response.text();
  return { status: response.status, body };
}

let health;
for (let i = 0; i < 120; i++) {
  health = await get("/health");
  if (health.status === 200) break;
  await new Promise(resolve => setTimeout(resolve, 1000));
}
if (health.status !== 200) throw new Error(`GENESIS_NOT_READY: HTTP ${health.status} ${health.body}`);

const models = await get("/v1/models");
if (models.status !== 200) throw new Error(`GENESIS_MODELS_FAILED: HTTP ${models.status} ${models.body}`);

const modelResponse = await fetch(endpoint + "/v1/chat/completions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: process.env.GENESIS_MODEL_ID || modelFile,
    messages: [{ role: "user", content: "Return exactly GENESIS_READY." }],
    max_tokens: 16,
    stream: false
  })
});
const inferenceBody = await modelResponse.text();
if (!modelResponse.ok) throw new Error(`GENESIS_INFERENCE_FAILED: HTTP ${modelResponse.status} ${inferenceBody}`);

const receipt = {
  schema: "OURSELF-GENESIS-BOOT-RECEIPT-v0.1",
  instance_id: "ALCHEMYSELFRVER01",
  authority: "OURSELF",
  execution: "FLOWACTIONSELFWORK",
  status: "EXECUTED_VERIFIED",
  endpoint,
  model_file: modelFile,
  model_sha256: sha256,
  health_http_status: health.status,
  models_http_status: models.status,
  inference_http_status: modelResponse.status,
  started_at: new Date().toISOString(),
  evidence: {
    health: JSON.parse(health.body),
    models: JSON.parse(models.body),
    inference: JSON.parse(inferenceBody)
  }
};

const receiptPath = process.env.GENESIS_RECEIPT_PATH || join(repoDir, "genesis", "receipts", "ALCHEMYSELFRVER01-latest.json");
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
