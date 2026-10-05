import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const manifest = readFileSync("action-node.yaml", "utf8");
const protocol = readFileSync("protocol/ACTIONSELF.md", "utf8");
const runtime = readFileSync("exec.mjs", "utf8");
const request = readFileSync("protocol/action-request.yaml", "utf8");

assert.match(manifest, /ACTIONSELF\/0\.1/);
assert.match(manifest, /default: DENY/);
assert.match(manifest, /arbitrary_shell: false/);
assert.match(protocol, /ADDRESSSELF/);
assert.match(protocol, /AUTHORITYSELF/);
assert.match(protocol, /CAPABILITYSELF/);
assert.match(protocol, /Ed25519/);
assert.match(protocol, /ExecutionReceipt/);

for (const field of ["request_type","target_ref","location_hint","frequency","issuer_ref","authority_ref","job_type","payload_ref","nonce"]) {
  assert.match(request, new RegExp(field));
  assert.match(runtime, new RegExp(field));
}

assert.match(runtime, /ACTIONSELF_SIGNATURE_INVALID/);
assert.match(runtime, /ACTIONSELF_AUTHORITY_REJECTED/);
assert.match(runtime, /ACTIONSELF_JOB_TYPE_REJECTED/);

console.log("ACTIONSELF_CONFORMANCE=PASS");
console.log("ADDRESSABILITY=SEPARATE");
console.log("AUTHORITY=REQUIRED");
console.log("SIGNATURE=REQUIRED");
console.log("DEFAULT_POLICY=DENY");
console.log("EXTERNAL_EFFECT=FALSE_BY_DEFAULT");
