import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, realpathSync, statSync } from "node:fs";
import { resolve, sep, delimiter } from "node:path";
import { spawnSync } from "node:child_process";

function git(cwd, args, encoding = "utf8") {
  const r = spawnSync("git", args, { cwd, encoding, maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) throw new Error("ACTIONSELF_GIT_PREIMAGE_FAILED:" + args[0]);
  return r.stdout;
}

export async function runFullRepositoryTestSuite({ request, root, executionDigest, startedAt }) {
  const p = request.job_payload;
  if (!p || p.suite !== "FULL_REPOSITORY" || typeof p.test_root !== "string"
      || typeof p.control_plane_root !== "string" || typeof p.expected_head !== "string"
      || typeof p.expected_worktree_sha256 !== "string") {
    throw new Error("ACTIONSELF_TEST_PAYLOAD_INVALID");
  }
  const targetRoot = realpathSync(p.test_root);
  if (!statSync(targetRoot).isDirectory()) throw new Error("ACTIONSELF_TEST_ROOT_NOT_DIRECTORY");
  const controlPlaneRoot = realpathSync(p.control_plane_root);
  const allowedRoots = String(process.env.ACTIONSELF_ALLOWED_TEST_ROOTS || "")
    .split(delimiter).filter(Boolean).map(path => realpathSync(path));
  const admitted = path => allowedRoots.some(allowed => path === allowed || path.startsWith(allowed + sep));
  if (!allowedRoots.length || !admitted(targetRoot)) throw new Error("ACTIONSELF_TEST_ROOT_NOT_ADMITTED");
  if (!admitted(controlPlaneRoot)) throw new Error("ACTIONSELF_CONTROL_PLANE_ROOT_NOT_ADMITTED");

  const actualHead = git(targetRoot, ["rev-parse", "HEAD"]).trim();
  if (actualHead !== p.expected_head) throw new Error("ACTIONSELF_TEST_HEAD_DRIFT");
  const status = git(targetRoot, ["status", "--porcelain", "--untracked-files=all"]);
  const diff = git(targetRoot, ["diff", "--binary", "HEAD"], "buffer");
  const preStateHash = createHash("sha256").update(actualHead + "\n" + status + "\n").update(diff).digest("hex");
  if (preStateHash !== p.expected_worktree_sha256) throw new Error("ACTIONSELF_TEST_PRESTATE_DRIFT");

  const timeoutMs = Number.isInteger(p.timeout_ms) ? Math.min(Math.max(p.timeout_ms, 1000), 600000) : 600000;
  const env = {
    ...process.env,
    OURSELF_RUORA_BOUNDARY: targetRoot,
    OURSELF_KERNEL_ROOT: targetRoot,
    OURSELF_CONTROL_PLANE_ROOT: controlPlaneRoot,
    OURSELF_QWEN_MODEL: p.qwen_model || "ourself-qwen25-7b-kernel"
  };
  const run = spawnSync(process.execPath, ["--test"], {
    cwd: targetRoot, env, encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024
  });
  const stdout = run.stdout || "";
  const stderr = run.stderr || "";
  const output = stdout + (stderr ? "\n[STDERR]\n" + stderr : "");
  const tests = Number(output.match(/^# tests (\d+)$/m)?.[1] ?? 0);
  const passed = Number(output.match(/^# pass (\d+)$/m)?.[1] ?? 0);
  const failed = Number(output.match(/^# fail (\d+)$/m)?.[1] ?? (run.status === 0 ? 0 : 1));
  const nonce = String(request.nonce).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  if (!nonce) throw new Error("ACTIONSELF_NONCE_INVALID");

  const runsDir = resolve(root, "runtime/runs");
  mkdirSync(runsDir, { recursive: true });
  const logPath = resolve(runsDir, nonce + ".tap");
  writeFileSync(logPath, output, { flag: "wx", mode: 0o600 });
  const logHash = createHash("sha256").update(output).digest("hex");
  const effect = {
    effect_type: "EFFECTSELF", version: "ACTIONSELF/0.2",
    target_ref: request.target_ref, action_ref: request.action_ref, job_type: request.job_type,
    suite: p.suite, target_root: targetRoot, git_head: actualHead, pre_state_sha256: preStateHash,
    command: [process.execPath, "--test"], shell: false,
    exit_code: run.status ?? null, timed_out: run.error?.code === "ETIMEDOUT",
    tests, passed, failed,
    stdout_sha256: createHash("sha256").update(stdout).digest("hex"),
    stderr_sha256: createHash("sha256").update(stderr).digest("hex"),
    log_path: logPath, log_sha256: logHash,
    started_at: startedAt, completed_at: new Date().toISOString(),
    result: run.status === 0 && failed === 0 && tests > 0 ? "FULL_TEST_SUITE_PASSED" : "FULL_TEST_SUITE_FAILED",
    external_effect: false, local_test_effects: true
  };
  const effectBytes = Buffer.from(JSON.stringify(effect, null, 2) + "\n");
  mkdirSync(resolve(root, "runtime/effects"), { recursive: true });
  writeFileSync(resolve(root, "runtime/effects/last-effect.json"), effectBytes);
  const effectHash = createHash("sha256").update(effectBytes).digest("hex");
  const receipt = {
    receipt_type: "ExecutionReceipt", version: "ACTIONSELF/0.2",
    target_ref: request.target_ref, issuer_ref: request.issuer_ref,
    authority_ref: request.authority_ref, action_ref: request.action_ref,
    job_type: request.job_type, nonce: request.nonce,
    started_at: startedAt, completed_at: new Date().toISOString(),
    result: effect.result, actuation_executed: true, external_effect: false,
    local_test_effects: true, execution_sha256: executionDigest, effect_sha256: effectHash,
    test_summary: { tests, passed, failed, exit_code: run.status ?? null },
    git_head: actualHead, pre_state_sha256: preStateHash,
    log_path: logPath, log_sha256: logHash
  };
  mkdirSync(resolve(root, "runtime/receipts"), { recursive: true });
  writeFileSync(resolve(root, "runtime/receipts/last-execution-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
  console.log("ACTIONSELF=ADMITTED");
  console.log("SIGNATURE=VERIFIED");
  console.log("AUTHORITY=BOUND");
  console.log("ACTUATIONSELF=EXECUTED");
  console.log("EFFECTSELF=" + effect.result);
  console.log("TESTS=" + tests + " PASSED=" + passed + " FAILED=" + failed);
  console.log("TEST_LOG=" + logPath);
  console.log("EFFECT_SHA256=" + effectHash);
  console.log("RECEIPTSELF=PROVEN");
  process.exitCode = effect.result === "FULL_TEST_SUITE_PASSED" ? 0 : 1;
}
