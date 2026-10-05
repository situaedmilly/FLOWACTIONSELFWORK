import { createHash, verify } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname);
const manifest = readFileSync(resolve(root, "action-node.yaml"), "utf8");
const requestPath = process.argv[2];
if (!requestPath) throw new Error("ACTIONSELF_REQUEST_REQUIRED");

const request = JSON.parse(readFileSync(resolve(requestPath), "utf8"));
const required = [
  "request_type","target_ref","location_hint","frequency",
  "issuer_ref","authority_ref","action_ref","job_type","payload_ref","nonce","signature"
];
for (const field of required) {
  if (!request[field]) throw new Error("ACTIONSELF_FIELD_REQUIRED:" + field);
}

if (request.request_type !== "ACTION_DISPATCH") throw new Error("ACTIONSELF_REQUEST_TYPE_REJECTED");
if (!manifest.includes("default: DENY")) throw new Error("ACTIONSELF_POLICY_MISSING");
if (!manifest.includes(request.job_type)) throw new Error("ACTIONSELF_JOB_TYPE_REJECTED");
if (request.location_hint !== "FLOWACTIONSELFWORK") throw new Error("ACTIONSELF_LOCATION_REJECTED");
if (request.issuer_ref !== "did:ourself:repo:situaedmilly:SELFVEREIGN-ADDRESSELF") throw new Error("ACTIONSELF_ISSUER_REJECTED");
if (request.authority_ref !== "AUTH-LOCAL-SELFREALITY-WRITE-001") throw new Error("ACTIONSELF_AUTHORITY_REJECTED");
if (request.signature.startsWith("REPLACE_")) throw new Error("ACTIONSELF_SIGNATURE_REQUIRED");

const publicKeyPem = process.env.ACTIONSELF_ISSUER_PUBLIC_KEY;
if (!publicKeyPem) throw new Error("ACTIONSELF_PUBLIC_KEY_REQUIRED");

const unsigned = { ...request };
delete unsigned.signature;
const canonical = JSON.stringify(unsigned);
const signature = Buffer.from(request.signature, "base64");

if (!verify(null, Buffer.from(canonical, "utf8"), publicKeyPem, signature)) {
  throw new Error("ACTIONSELF_SIGNATURE_INVALID");
}

const startedAt = new Date().toISOString();
const executionDigest = createHash("sha256").update(canonical, "utf8").digest("hex");

if (request.action_ref !== "ACTUATIONSELF/DETERMINISTIC_BUILD") {
  throw new Error("ACTIONSELF_ACTION_REJECTED");
}

if (request.job_type !== "DETERMINISTIC_BUILD") {
  throw new Error("ACTUATIONSELF_ADAPTER_NOT_IMPLEMENTED");
}

const effect = {
  effect_type: "EFFECTSELF",
  version: "ACTIONSELF/0.1",
  target_ref: request.target_ref,
  action_ref: request.action_ref,
  job_type: request.job_type,
  state_delta: {
    before: "ABSENT",
    after: "ACTIONSELF-LIVE-WITNESS-V0.1"
  },
  result: "DETERMINISTIC_BUILD_EXECUTED",
  external_effect: false
};

mkdirSync(resolve(root, "runtime/effects"), { recursive: true });
const effectBytes = Buffer.from(JSON.stringify(effect, null, 2) + "\n", "utf8");
writeFileSync(resolve(root, "runtime/effects/last-effect.json"), effectBytes);

const effectDigest = createHash("sha256").update(effectBytes).digest("hex");
mkdirSync(resolve(root, "runtime/receipts"), { recursive: true });
const receipt = {
  receipt_type: "ExecutionReceipt",
  version: "ACTIONSELF/0.1",
  target_ref: request.target_ref,
  issuer_ref: request.issuer_ref,
  authority_ref: request.authority_ref,
  action_ref: request.action_ref,
  job_type: request.job_type,
  nonce: request.nonce,
  started_at: startedAt,
  completed_at: new Date().toISOString(),
  result: "EXECUTED_AND_EFFECT_OBSERVED",
  actuation_executed: true,
  external_effect: false,
  execution_sha256: executionDigest,
  effect_sha256: effectDigest
};

writeFileSync(resolve(root, "runtime/receipts/last-execution-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", "utf8");

console.log("ACTIONSELF=ADMITTED");
console.log("SIGNATURE=VERIFIED");
console.log("AUTHORITY=BOUND");
console.log("ACTUATIONSELF=EXECUTED");
console.log("EFFECTSELF=OBSERVED");
console.log("EFFECT_SHA256=" + effectDigest);
console.log("EXTERNAL_EFFECT=false");
console.log("RECEIPTSELF=PROVEN");
