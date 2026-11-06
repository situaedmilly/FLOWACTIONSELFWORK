import { createHash, randomUUID, sign } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { resolve, delimiter, sep } from "node:path";
import { spawnSync } from "node:child_process";

const actionRoot = resolve(import.meta.dirname, "..");
if (!process.argv[2] || !process.argv[3]) {
  throw new Error("USAGE: node runner/dispatch-test-suite.mjs /absolute/test-repo /absolute/control-plane-repo");
}
const testRoot = realpathSync(process.argv[2]);
const controlPlaneRoot = realpathSync(process.argv[3]);
const allowedRoots = String(process.env.ACTIONSELF_ALLOWED_TEST_ROOTS || "")
  .split(delimiter).filter(Boolean).map(path => realpathSync(path));
const admitted = path => allowedRoots.some(allowed => path === allowed || path.startsWith(allowed + sep));
if (!allowedRoots.length || !admitted(testRoot) || !admitted(controlPlaneRoot)) {
  throw new Error("ACTIONSELF_DISPATCH_ROOT_NOT_ADMITTED");
}
const privateKeyPath = process.env.ACTIONSELF_ISSUER_PRIVATE_KEY_FILE;
const publicKeyPath = process.env.ACTIONSELF_ISSUER_PUBLIC_KEY_FILE;
if (!privateKeyPath || !publicKeyPath) throw new Error("ACTIONSELF_ISSUER_KEYPAIR_REQUIRED");
const privateKey = readFileSync(privateKeyPath, "utf8");
const publicKey = readFileSync(publicKeyPath, "utf8");
function git(args, encoding = "utf8") {
  const r = spawnSync("git", args, { cwd: testRoot, encoding, maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) throw new Error("ACTIONSELF_GIT_PREIMAGE_FAILED");
  return r.stdout;
}
const head = git(["rev-parse", "HEAD"]).trim();
const status = git(["status", "--porcelain", "--untracked-files=all"]);
const diff = git(["diff", "--binary", "HEAD"], "buffer");
const worktreeHash = createHash("sha256").update(head + "\n" + status + "\n").update(diff).digest("hex");
const nonce = randomUUID();
const unsigned = {
  request_type: "ACTION_DISPATCH",
  target_ref: "repo:situaedmilly/ourself-agent-bridge-kernel@" + head,
  location_hint: "FLOWACTIONSELFWORK",
  frequency: "ON_DEMAND",
  issuer_ref: "did:ourself:repo:situaedmilly:SELFVEREIGN-ADDRESSELF",
  authority_ref: "AUTH-LOCAL-ACTIONSELF-TEST-RUN-001",
  action_ref: "ACTUATIONSELF/FULL_REPOSITORY_TEST_SUITE",
  job_type: "TEST_SUITE",
  payload_ref: "superbin://ourself-agent-bridge-kernel#FULL_REPOSITORY_TEST_SUITE",
  nonce,
  job_payload: {
    suite: "FULL_REPOSITORY", test_root: testRoot, control_plane_root: controlPlaneRoot,
    expected_head: head, expected_worktree_sha256: worktreeHash,
    timeout_ms: 600000, qwen_model: process.env.OURSELF_QWEN_MODEL || "ourself-qwen25-7b-kernel"
  }
};
const signature = sign(null, Buffer.from(JSON.stringify(unsigned)), privateKey).toString("base64");
const request = { ...unsigned, signature };
const requestsDir = resolve(actionRoot, "runtime/requests");
mkdirSync(requestsDir, { recursive: true });
const requestPath = resolve(requestsDir, nonce + ".json");
writeFileSync(requestPath, JSON.stringify(request, null, 2) + "\n", { flag: "wx", mode: 0o600 });
const runner = spawnSync(process.execPath, [resolve(actionRoot, "runner/ourself-action-runner.mjs"), requestPath], {
  cwd: actionRoot,
  env: { ...process.env, ACTIONSELF_ISSUER_PUBLIC_KEY: publicKey },
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024
});
if (runner.stdout) process.stdout.write(runner.stdout);
if (runner.stderr) process.stderr.write(runner.stderr);
const receiptPath = resolve(actionRoot, "runtime/receipts/last-execution-receipt.json");
let receipt = null;
try { receipt = JSON.parse(readFileSync(receiptPath, "utf8")); } catch {}
console.log(JSON.stringify({
  action_node: "FLOWACTIONSELFWORK", runner: "OURSELF_ACTION_RUNNER",
  request_path: requestPath, runner_exit_code: runner.status,
  receipt: receipt ? {
    result: receipt.result, test_summary: receipt.test_summary,
    log_path: receipt.log_path, log_sha256: receipt.log_sha256,
    effect_sha256: receipt.effect_sha256, nonce: receipt.nonce
  } : null
}, null, 2));
process.exitCode = runner.status === 0 && receipt?.result === "FULL_TEST_SUITE_PASSED" ? 0 : 1;
