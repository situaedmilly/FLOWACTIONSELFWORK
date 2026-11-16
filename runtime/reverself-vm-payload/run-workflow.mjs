#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function fail(message) { throw new Error(message); }
function requireValue(condition, message) { if (!condition) fail(message); }
function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function readJson(file) {
  const bytes = await fs.readFile(file);
  if (bytes.byteLength > 1024 * 1024) fail("input exceeds 1 MiB: " + file);
  return JSON.parse(bytes.toString("utf8"));
}
const args = Object.fromEntries(process.argv.slice(2).reduce((out, item, i, all) => {
  if (item.startsWith("--")) out.push([item.slice(2), all[i + 1]]);
  return out;
}, []));
for (const key of ["dispatch", "workflow", "manifest", "build-spec", "schema", "receipt-dir"]) {
  requireValue(typeof args[key] === "string" && args[key].length > 0, "missing --" + key);
}
const [dispatch, workflow, manifest] = await Promise.all([
  readJson(path.resolve(args.dispatch)),
  readJson(path.resolve(args.workflow)),
  readJson(path.resolve(args.manifest))
]);
const checks = [];
function check(id, condition, detail) {
  checks.push({id, status: condition ? "PASS" : "BLOCKED", detail});
  requireValue(condition, id + ": " + detail);
}
check("DISPATCH_ACTION", dispatch.action === "VALIDATE_VM_PAYLOAD_DECLARATION" && dispatch.status === "DISPATCHED", "dispatch is the expected active PULL-0006 action");
check("DISPATCH_AUTHORITY", dispatch.authority === "EXPLICIT_USER_EXECUTION_REQUEST", "explicit user execution authority is present");
check("DISPATCH_SCOPE", dispatch.execution_scope === "READ_ONLY_DECLARATION_VALIDATION_AND_BUILD_PLAN_EMISSION", "dispatch scope is bounded to declaration validation");
check("WORKFLOW_BINDING", workflow.workflow_id === "OURSELFLOW-REVERSELF-VM-PAYLOAD-GENESIS-001" && workflow.dispatch_id === dispatch.dispatch_id && workflow.pull_id === dispatch.pull_id, "workflow, dispatch and PULL identifiers match");
check("SOURCE_BINDING", workflow.source?.repository === dispatch.data_repo && workflow.source?.ref === dispatch.data_ref && workflow.source?.manifest === dispatch.manifest_path && workflow.source?.build_spec === dispatch.build_spec_path, "workflow source points to the exact DATASELF ref and artifacts");
check("EXECUTION_MODE", workflow.execution_mode === "BOUNDED_VALIDATION" && workflow.orchestrator === "FLOWACTIONSELFWORK", "bounded local validation is routed through FLOWACTIONSELFWORK");
check("PAYLOAD_BINDING", manifest.payload_id === "REVERSELF-WINARM64-GENESIS-001", "manifest payload identity matches PULL-0006");
const expectedSteps = ["RESOLVE_DECLARATION","VALIDATE_SCHEMA_AND_IDENTITY_BINDING","VALIDATE_COMPONENT_ROLE_COVERAGE","VALIDATE_BUILD_ORDER_AND_STOP_CONDITIONS","EMIT_DECLARATION_VALIDATION_RECEIPT"];
check("STEP_ORDER", Array.isArray(workflow.steps) && workflow.steps.length === expectedSteps.length && workflow.steps.every((s,i) => s.step_id === "FLOW-000" + (i+1) && s.operation === expectedSteps[i]), "all five declared workflow steps are present in order");
check("EFFECT_BOUNDARY", dispatch.prohibited_effects.includes("QEMU_INSTALLATION") && dispatch.prohibited_effects.includes("DISK_MATERIALIZATION") && dispatch.prohibited_effects.includes("VM_BOOT") && dispatch.prohibited_effects.includes("LAUNCH_ADMISSION"), "prohibited effects remain explicitly denied");

const here = path.dirname(fileURLToPath(import.meta.url));
const validator = path.join(here, "validate-manifest.mjs");
const receiptDir = path.resolve(args["receipt-dir"]);
await fs.mkdir(receiptDir, {recursive:true, mode:0o700});
const child = spawnSync(process.execPath, [
  validator,
  "--manifest", path.resolve(args.manifest),
  "--build-spec", path.resolve(args["build-spec"]),
  "--schema", path.resolve(args.schema),
  "--receipt-dir", receiptDir
], {
  cwd: here,
  encoding: "utf8",
  timeout: 30000,
  maxBuffer: 1024 * 1024,
  env: {PATH: process.env.PATH || "/usr/bin:/bin", LANG:"C.UTF-8", NODE_OPTIONS:""}
});
requireValue(child.error === undefined, "validator process failed to start: " + String(child.error || ""));
requireValue(child.status === 0, "validator exited non-zero: " + (child.stderr || child.stdout || child.status));
let validation;
try { validation = JSON.parse(child.stdout); } catch { fail("validator did not return a JSON result: " + child.stdout); }
check("VALIDATOR_EXECUTION", validation.disposition === "DECLARATION_VALIDATED_BUILD_PENDING" && validation.checks_passed === 16, "manifest validator completed 16/16 invariants");
const validationReceipt = await readJson(validation.receipt_path);
check("VALIDATOR_RECEIPT", validationReceipt.receipt_sha256 === validation.receipt_sha256 && validationReceipt.payload_id === manifest.payload_id, "validator receipt re-read and bound to this payload");
check("NO_EXTERNAL_EFFECT", validationReceipt.external_effect === false && validationReceipt.payload_materialized === false && validationReceipt.launch_authorized === false, "validator performed no external effect or VM actuation");

const workflowReceipt = {
  schema_version: "ourself.flow-execution-receipt.v1",
  receipt_id: "FLOW-RECEIPT-" + crypto.randomUUID(),
  timestamp_utc: new Date().toISOString(),
  workflow_id: workflow.workflow_id,
  dispatch_id: dispatch.dispatch_id,
  pull_id: dispatch.pull_id,
  payload_id: manifest.payload_id,
  disposition: "WORKFLOW_EXECUTED_DECLARATION_VALIDATED_BUILD_PENDING",
  orchestrator: "FLOWACTIONSELFWORK",
  executor: "OURSELFLOW-VM-PAYLOAD-EXECUTOR",
  execution_mode: "BOUNDED_VALIDATION",
  workflow_checks: checks,
  validator_receipt: {
    path: validation.receipt_path,
    sha256: validation.receipt_sha256,
    manifest_sha256: validation.manifest_sha256,
    build_spec_sha256: validation.build_spec_sha256,
    checks_passed: validation.checks_passed
  },
  effects: {
    workflow_execution_performed: true,
    payload_materialized: false,
    external_effect: false,
    launch_authorized: false,
    vm_booted: false
  },
  next_required_stages: ["RESOLVE_INSTALLATION_LICENSE","AUTHORIZE_PARALLELS_DESKTOP_27_INSTALLATION","DESIGNATE_SUFFICIENT_STORAGE","MATERIALIZE_NEW_VM_CONFIGURATION_AND_DISK"]
};
workflowReceipt.receipt_sha256 = sha256(canonical(workflowReceipt));
const receiptPath = path.join(receiptDir, workflowReceipt.receipt_id + ".json");
const payload = JSON.stringify(workflowReceipt, null, 2) + "\n";
const handle = await fs.open(receiptPath, "wx", 0o600);
try { await handle.writeFile(payload); await handle.sync(); } finally { await handle.close(); }
const readback = await fs.readFile(receiptPath, "utf8");
requireValue(readback === payload, "workflow receipt read-back byte mismatch");
const parsed = JSON.parse(readback);
const claimed = parsed.receipt_sha256;
delete parsed.receipt_sha256;
requireValue(claimed === sha256(canonical(parsed)), "workflow receipt digest mismatch");
console.log(JSON.stringify({
  disposition: workflowReceipt.disposition,
  workflow_id: workflowReceipt.workflow_id,
  payload_id: workflowReceipt.payload_id,
  workflow_checks_passed: checks.length,
  validator_checks_passed: validation.checks_passed,
  validator_receipt_sha256: validation.receipt_sha256,
  workflow_receipt_path: receiptPath,
  workflow_receipt_sha256: claimed,
  external_effect: false,
  payload_materialized: false,
  launch_authorized: false
}, null, 2));
