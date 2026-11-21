import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const runtimeEndpoint = process.env.GENESIS_ENDPOINT;
const cognitionEndpoint = process.env.OURSELF_COGNITION_BASE_URL;
const model = process.env.OURSELF_MODEL_ID;
const receiptPath = process.env.GENESIS_RECEIPT_PATH ||
  join(process.env.GENESIS_REPO_DIR || ".", "genesis", "receipts", "ALCHEMYSELFRVER01-latest.json");

for (const [name, value] of Object.entries({
  GENESIS_ENDPOINT: runtimeEndpoint,
  OURSELF_COGNITION_BASE_URL: cognitionEndpoint,
  OURSELF_MODEL_ID: model,
  GENESIS_RECEIPT_PATH: receiptPath
})) {
  if (!value || !String(value).trim()) throw new Error(`REQUIRED_BINDING_MISSING: ${name}`);
}
if (runtimeEndpoint === cognitionEndpoint) {
  throw new Error("ENDPOINT_JURISDICTION_COLLISION: runtime and cognition endpoints must be explicitly distinct");
}

const runtimeBase = runtimeEndpoint.replace(/\/$/, "");
const cognitionBase = cognitionEndpoint.replace(/\/$/, "");
const requestId = randomUUID();
const startedAt = new Date().toISOString();

async function request(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP_FAILURE: ${url} returned ${response.status}: ${body.slice(0, 1000)}`);
  return { status: response.status, body };
}
function parseJson(label, body) {
  try { return JSON.parse(body); }
  catch { throw new Error(`INVALID_JSON: ${label} did not return JSON`); }
}

const runtimeHealthRaw = await request(`${runtimeBase}/health`);
const runtimeHealth = parseJson("Genesis runtime /health", runtimeHealthRaw.body);
const modelsRaw = await request(`${cognitionBase}/models`);
const modelsPayload = parseJson("cognition /models", modelsRaw.body);
const availableModels = Array.isArray(modelsPayload.data) ? modelsPayload.data :
  (Array.isArray(modelsPayload.models) ? modelsPayload.models : []);
if (!availableModels.some(item => item?.id === model || item?.name === model)) {
  throw new Error(`MODEL_NOT_RESOLVED: requested model '${model}' is absent from cognition /models`);
}

const prompt = "Return exactly SOVEREIGN_CROSSING_VERIFIED.";
const inferenceRaw = await request(`${cognitionBase}/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-ourself-request-id": requestId },
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 32,
    temperature: 0,
    stream: false
  })
});
const inference = parseJson("cognition inference", inferenceRaw.body);
const observedText = inference?.choices?.[0]?.message?.content;
if (typeof observedText !== "string" || observedText.trim() !== "SOVEREIGN_CROSSING_VERIFIED") {
  throw new Error("INFERENCE_CONTENT_MISMATCH: HTTP success did not produce the exact crossing witness");
}

const responseHash = createHash("sha256").update(inferenceRaw.body).digest("hex");
const receipt = {
  schema: "OURSELF-CROSSING-LAUNCH-RECEIPT-v0.3",
  instance_id: "ALCHEMYSELFRVER01",
  authority: "OURSELF",
  execution: "FLOWACTIONSELFWORK",
  status: "CROSSING_OBSERVED",
  request_id: requestId,
  started_at: startedAt,
  completed_at: new Date().toISOString(),
  runtime: { endpoint: runtimeBase, health_http_status: runtimeHealthRaw.status, health: runtimeHealth },
  cognition: {
    endpoint: cognitionBase,
    model,
    models_http_status: modelsRaw.status,
    inference_http_status: inferenceRaw.status,
    observed_response: observedText.trim(),
    response_sha256: responseHash
  },
  crossing_observation: {
    request_dispatched_by: "ALCHEMYSELFRVER01",
    request_target: `${cognitionBase}/chat/completions`,
    exact_response_validated: true,
    durable_receipt_written: false
  },
  evidence: { cognition_models: modelsPayload, inference_response: inference }
};

mkdirSync(dirname(receiptPath), { recursive: true });
const temporaryPath = `${receiptPath}.tmp-${requestId}`;
writeFileSync(temporaryPath, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
renameSync(temporaryPath, receiptPath);
const firstReadback = readFileSync(receiptPath, "utf8");
const firstParsed = parseJson("receipt read-back", firstReadback);
if (firstParsed.request_id !== requestId || firstParsed.cognition?.response_sha256 !== responseHash) {
  throw new Error("RECEIPT_READBACK_MISMATCH: persisted receipt does not match observed crossing");
}
receipt.crossing_observation.durable_receipt_written = true;
const finalTemporaryPath = `${receiptPath}.verified.tmp-${requestId}`;
writeFileSync(finalTemporaryPath, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
renameSync(finalTemporaryPath, receiptPath);
const finalReadback = parseJson("final receipt read-back", readFileSync(receiptPath, "utf8"));
if (finalReadback.crossing_observation?.durable_receipt_written !== true ||
    finalReadback.request_id !== requestId ||
    finalReadback.cognition?.response_sha256 !== responseHash) {
  throw new Error("FINAL_RECEIPT_READBACK_FAILED");
}
console.log(JSON.stringify({
  status: "CROSSING_OBSERVED_AND_RECEIPT_READ_BACK",
  request_id: requestId,
  model,
  response_sha256: responseHash,
  receipt_path: receiptPath,
  receipt_readback_verified: true
}, null, 2));
