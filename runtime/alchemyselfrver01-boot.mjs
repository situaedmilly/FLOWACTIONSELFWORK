import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const runtimeEndpoint = process.env.GENESIS_ENDPOINT;
const cognitionEndpoint = process.env.OURSELF_COGNITION_BASE_URL || runtimeEndpoint;
const model = process.env.OURSELF_MODEL_ID || "ourself-qwen38-27b-iq2s-80k:latest";
const repoDir = process.env.GENESIS_REPO_DIR || ".";
const receiptPath =
  process.env.GENESIS_RECEIPT_PATH ||
  join(repoDir, "genesis", "receipts", "ALCHEMYSELFRVER01-latest.json");

if (!runtimeEndpoint) {
  throw new Error(
    "OURSELF_RUNTIME_ENDPOINT_REQUIRED: set GENESIS_ENDPOINT to the resident runtime endpoint"
  );
}
if (!cognitionEndpoint) {
  throw new Error(
    "OURSELF_COGNITION_ENDPOINT_REQUIRED: set OURSELF_COGNITION_BASE_URL or GENESIS_ENDPOINT"
  );
}

const normalizedCognitionEndpoint = cognitionEndpoint.replace(/\/$/, "");
const requestId = randomUUID();
const startedAt = new Date().toISOString();

async function get(url) {
  const response = await fetch(url);
  const body = await response.text();
  return { status: response.status, body };
}

async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ourself-request-id": requestId
    },
    body: JSON.stringify(body)
  });
  const responseBody = await response.text();
  return { status: response.status, body: responseBody };
}

const runtimeHealth = await get(runtimeEndpoint.replace(/\/$/, "") + "/health");
if (runtimeHealth.status !== 200) {
  throw new Error(
    `OURSELF_RUNTIME_NOT_READY: HTTP ${runtimeHealth.status} ${runtimeHealth.body}`
  );
}

const cognitionModels = await get(normalizedCognitionEndpoint + "/models");
if (cognitionModels.status !== 200) {
  throw new Error(
    `OURSELF_COGNITION_NOT_READY: HTTP ${cognitionModels.status} ${cognitionModels.body}`
  );
}

const prompt = "Return exactly SOVEREIGN_CROSSING_VERIFIED.";
const crossing = await post(normalizedCognitionEndpoint + "/chat/completions", {
  model,
  messages: [{ role: "user", content: prompt }],
  max_tokens: 16,
  stream: false
});

if (!crossing.status || crossing.status < 200 || crossing.status >= 300) {
  throw new Error(
    `OURSELF_COGNITION_CROSSING_FAILED: HTTP ${crossing.status} ${crossing.body}`
  );
}

const responseHash = createHash("sha256").update(crossing.body).digest("hex");

const receipt = {
  schema: "OURSELF-CROSSING-LAUNCH-RECEIPT-v0.2",
  instance_id: "ALCHEMYSELFRVER01",
  authority: "OURSELF",
  execution: "FLOWACTIONSELFWORK",
  status: "CROSSING_OBSERVED",
  request_id: requestId,
  started_at: startedAt,
  runtime: {
    endpoint: runtimeEndpoint,
    health_http_status: runtimeHealth.status
  },
  cognition: {
    endpoint: normalizedCognitionEndpoint,
    model,
    models_http_status: cognitionModels.status,
    inference_http_status: crossing.status,
    response_sha256: responseHash
  },
  witnessing_requirement:
    "TO WITNESS CROSSING: observe the actual traversal from the resident OURSELF execution runtime through the resolved cognition route into the OURSELF cognition substrate, capture the crossing evidence, correlate the request/response, and bind the observed crossing to a durable receipt; declaration, configuration, endpoint health, or simulated invocation alone does not satisfy this requirement.",
  causal_target:
    "RESIDENT EXECUTION RUNTIME -> RESOLVED ROUTE -> ACTUAL TRANSPORT CROSSING -> OURSELF COGNITION ENDPOINT -> QWEN INSTANCE -> RESPONSE -> OBSERVATION -> DURABLE RECEIPT",
  crossing_observation: {
    request_dispatched_by: "ALCHEMYSELFRVER01",
    request_target: normalizedCognitionEndpoint + "/chat/completions",
    response_observed: true,
    durable_receipt_written: true
  },
  evidence: {
    runtime_health: JSON.parse(runtimeHealth.body),
    cognition_models: JSON.parse(cognitionModels.body),
    inference_response: JSON.parse(crossing.body)
  }
};

writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
