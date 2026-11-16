#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

function fail(message) { throw new Error(message); }
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
  return { value: JSON.parse(bytes.toString("utf8")), bytes };
}
function requireValue(condition, message) { if (!condition) fail(message); }

const args = Object.fromEntries(process.argv.slice(2).reduce((out, item, i, all) => {
  if (item.startsWith("--")) out.push([item.slice(2), all[i + 1]]);
  return out;
}, []));
for (const key of ["manifest", "build-spec", "schema", "receipt-dir"]) {
  requireValue(typeof args[key] === "string" && args[key].length > 0, "missing --" + key);
}

const manifestPath = path.resolve(args.manifest);
const specPath = path.resolve(args["build-spec"]);
const schemaPath = path.resolve(args.schema);
const receiptDir = path.resolve(args["receipt-dir"]);
const [{value: manifest, bytes: manifestBytes}, {value: spec, bytes: specBytes}, {value: schema}] =
  await Promise.all([readJson(manifestPath), readJson(specPath), readJson(schemaPath)]);

const checks = [];
function check(id, condition, detail) {
  checks.push({ id, status: condition ? "PASS" : "BLOCKED", detail });
  requireValue(condition, id + ": " + detail);
}
const requiredManifestKeys = [
  "schema_version","payload_id","reality_id","instance_id","declared_on","lifecycle",
  "guest","hardware","firmware","storage","runtime","installation","components","build_plan","admission"
];
check("SCHEMA_DRAFT", schema.$schema === "https://json-schema.org/draft/2020-12/schema", "Draft 2020-12 schema declared");
check("MANIFEST_SCHEMA", manifest.schema_version === "ourself.vm-payload.v1" && schema.properties?.schema_version?.const === manifest.schema_version, "manifest and schema versions match");
check("MANIFEST_KEYS", requiredManifestKeys.every(k => Object.hasOwn(manifest, k)) && Object.keys(manifest).every(k => requiredManifestKeys.includes(k)), "manifest has exact required top-level key set");
check("PAYLOAD_IDENTITY", manifest.payload_id === "REVERSELF-WINARM64-GENESIS-001" && manifest.reality_id && manifest.instance_id, "new payload, reality and instance identities are explicit");
check("GUEST_ARCHITECTURE", manifest.guest?.product === "Windows 11 ARM64" && manifest.guest?.architecture === "aarch64" && manifest.guest?.firmware_mode === "UEFI" && manifest.guest?.secure_boot === true && manifest.guest?.tpm_version === "2.0", "Windows ARM64 / AArch64 UEFI / Secure Boot / TPM 2.0");
check("HARDWARE_PROFILE", manifest.hardware?.vcpus === 4 && manifest.hardware?.memory_mib === 8192 && manifest.hardware?.disk_capacity_bytes === 137438953472, "4 vCPU, 8 GiB RAM, 128 GiB virtual disk");
check("STORAGE_BINDING", manifest.storage?.format === "RAW" && manifest.storage?.allocation === "SPARSE" && manifest.storage?.disk_artifact_id === "ART-REVERSELF-WINARM64-GUEST-DISK-001" && manifest.storage?.status === "NOT_CREATED", "new sparse RAW disk declared, not yet materialized");
check("COMPONENT_COVERAGE", Array.isArray(manifest.components) && ["VM_CONFIGURATION","GUEST_INSTALLER_ISO","GUEST_DISK","FIRMWARE_CODE","FIRMWARE_VARIABLES","RUNTIME_ADAPTER","DRIVER_BUNDLE","PRESERVATION_SNAPSHOT"].every(role => manifest.components.filter(c => c.role === role).length === 1), "all eight required component roles occur exactly once");
check("UNMATERIALIZED_COMPONENTS", manifest.components.every(c => c.lifecycle === "DECLARED" || (c.lifecycle === "NOT_MATERIALIZED" && c.sha256 === null && c.byte_count === null && c.storage_ref === null)), "unmaterialized artifacts do not claim hashes, byte counts or storage refs");
check("RUNTIME_BOUNDARY", manifest.runtime?.selection_status === "UNSELECTED" && manifest.runtime?.qemu_installation_authorized === false && manifest.runtime?.compatibility_status === "NOT_EVALUATED", "runtime remains unselected; QEMU installation is not authorized");
check("INSTALL_MEDIA_BOUNDARY", manifest.installation?.media_status === "NOT_ACQUIRED" && manifest.installation?.license_status === "UNRESOLVED", "official installer media and licensing remain unresolved");
check("ADMISSION_BOUNDARY", manifest.admission?.status === "NOT_REQUESTED" && manifest.admission?.authority_ref === null && manifest.admission?.custody_ref === null && manifest.admission?.witness_ref === null, "no authority, custody or witness is fabricated");
check("BUILD_SPEC_BINDING", spec.schema_version === "ourself.vm-build-spec.v1" && spec.payload_id === manifest.payload_id && spec.manifest_path.endsWith("/manifest.json"), "build spec binds to this payload identity");
check("BUILD_ORDER", Array.isArray(spec.assembly_order) && ["Resolve official Windows 11 ARM64 installer media and verify provenance, digest and byte count","Resolve compatible AArch64 UEFI firmware code and establish a new variable-store instance","Inspect existing host hypervisor without installing or upgrading runtime software","Create a new sparse RAW guest disk at the declared capacity","Assemble a canonical DATASELF envelope with per-component hashes and byte counts","Create and verify a preservation copy before any first boot","Request explicit launch admission against the completed evidence set","Only after admission, perform the separately authorized first boot"].every(stage => spec.assembly_order.includes(stage)), "build order contains media, firmware, runtime, disk, envelope, preservation, admission and boot gates");
check("NO_ORIGINAL_REUSE", spec.execution_constraints?.original_vm_payload === "OUT_OF_SCOPE" && spec.execution_constraints?.original_vm_uuid_reuse === false, "new payload is distinct from historical VM");
check("ORCHESTRATOR", spec.execution_constraints?.orchestrator === "FLOWACTIONSELFWORK" && spec.execution_constraints?.github_actions === "NOT_AN_EXECUTION_ENGINE", "FLOWACTIONSELFWORK is the orchestrator; GitHub Actions excluded");

const manifestDigest = sha256(canonical(manifest));
const specDigest = sha256(canonical(spec));
const receipt = {
  schema_version: "ourself.vm-payload-validation-receipt.v1",
  receipt_id: "VM-PAYLOAD-DECLARATION-" + crypto.randomUUID(),
  timestamp_utc: new Date().toISOString(),
  workflow_id: "OURSELFLOW-REVERSELF-VM-PAYLOAD-GENESIS-001",
  dispatch_id: "DISPATCH-0006",
  payload_id: manifest.payload_id,
  manifest_sha256: manifestDigest,
  manifest_bytes: manifestBytes.byteLength,
  build_spec_sha256: specDigest,
  build_spec_bytes: specBytes.byteLength,
  schema_sha256: sha256(canonical(schema)),
  checks,
  disposition: "DECLARATION_VALIDATED_BUILD_PENDING",
  execution_performed: true,
  payload_materialized: false,
  external_effect: false,
  launch_authorized: false,
  next_required_stages: ["RESOLVE_OFFICIAL_INSTALLER_MEDIA","RESOLVE_COMPATIBLE_FIRMWARE","INSPECT_EXISTING_HOST_HYPERVISOR","SELECT_RUNTIME_ADAPTER"]
};
const unsigned = canonical(receipt);
receipt.receipt_sha256 = sha256(unsigned);
await fs.mkdir(receiptDir, { recursive: true, mode: 0o700 });
const receiptPath = path.join(receiptDir, receipt.receipt_id + ".json");
const output = JSON.stringify(receipt, null, 2) + "\n";
const handle = await fs.open(receiptPath, "wx", 0o600);
try { await handle.writeFile(output); await handle.sync(); } finally { await handle.close(); }
const readback = await fs.readFile(receiptPath, "utf8");
requireValue(readback === output, "receipt read-back byte mismatch");
const parsed = JSON.parse(readback);
const claimed = parsed.receipt_sha256;
delete parsed.receipt_sha256;
requireValue(claimed === sha256(canonical(parsed)), "receipt digest read-back mismatch");
console.log(JSON.stringify({
  disposition: receipt.disposition,
  payload_id: receipt.payload_id,
  manifest_sha256: manifestDigest,
  build_spec_sha256: specDigest,
  checks_passed: checks.length,
  receipt_path: receiptPath,
  receipt_sha256: claimed,
  payload_materialized: false,
  launch_authorized: false
}, null, 2));
