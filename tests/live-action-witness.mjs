import { generateKeyPairSync, sign } from "node:crypto";
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname);
const work = resolve(root, "runtime/live-witness");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
const request = {
  request_type: "ACTION_DISPATCH",
  target_ref: "SELFREALITY#FIRST-ALCHEMY-LAUNCH",
  location_hint: "FLOWACTIONSELFWORK",
  frequency: "ON_DEMAND",
  issuer_ref: "did:ourself:repo:situaedmilly:SELFVEREIGN-ADDRESSELF",
  authority_ref: "AUTH-LOCAL-SELFREALITY-WRITE-001",
  action_ref: "ACTUATIONSELF/DETERMINISTIC_BUILD",
  job_type: "DETERMINISTIC_BUILD",
  payload_ref: "superbin://SELFREALITY#FIRST-ALCHEMY-LAUNCH",
  nonce: "ACTIONSELF-LIVE-WITNESS-V0.1"
};
const canonical = JSON.stringify(request);
const signature = sign(null, Buffer.from(canonical, "utf8"), privateKey).toString("base64");
const requestPath = resolve(work, "request.json");
writeFileSync(requestPath, JSON.stringify({ ...request, signature }, null, 2) + "\n");

execFileSync(process.execPath, [resolve(root, "exec.mjs"), requestPath], {
  env: { ...process.env, ACTIONSELF_ISSUER_PUBLIC_KEY: publicKeyPem },
  stdio: "inherit"
});

const effectPath = resolve(root, "runtime/effects/last-effect.json");
const receiptPath = resolve(root, "runtime/receipts/last-execution-receipt.json");
const effectBytes = readFileSync(effectPath);
const effect = JSON.parse(effectBytes);
const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));

assert.equal(effect.result, "DETERMINISTIC_BUILD_EXECUTED");
assert.equal(effect.target_ref, request.target_ref);
assert.equal(effect.action_ref, request.action_ref);
assert.equal(effect.external_effect, false);
assert.equal(receipt.result, "EXECUTED_AND_EFFECT_OBSERVED");
assert.equal(receipt.actuation_executed, true);
assert.equal(receipt.effect_sha256.length, 64);
assert.equal(receipt.execution_sha256.length, 64);
assert.equal(receipt.effect_sha256,
  (await import("node:crypto")).createHash("sha256").update(effectBytes).digest("hex"));

console.log("REQUEST=VERIFIED");
console.log("ACTIONSELF=ADMITTED");
console.log("ACTUATIONSELF=EXECUTED");
console.log("EFFECTSELF=OBSERVED");
console.log("RECEIPTSELF=PROVEN");
console.log("EXTERNAL_EFFECT=false");
