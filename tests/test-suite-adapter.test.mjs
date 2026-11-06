import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = readFileSync(new URL("../action-node.yaml", import.meta.url), "utf8");
const exec = readFileSync(new URL("../exec.mjs", import.meta.url), "utf8");
const adapter = readFileSync(new URL("../runtime/test-suite-adapter.mjs", import.meta.url), "utf8");
const dispatcher = readFileSync(new URL("../runner/dispatch-test-suite.mjs", import.meta.url), "utf8");

test("ACTIONSELF admits only the typed full-repository test adapter", () => {
  assert.match(manifest, /github_actions_execution:\s*false/);
  assert.match(manifest, /TEST_SUITE/);
  assert.match(manifest, /arbitrary_shell:\s*false/);
  assert.match(exec, /ACTIONSELF\/FULL_REPOSITORY_TEST_SUITE/);
  assert.match(exec, /verify\(/);
});
test("test adapter is shell-free, target-allowlisted, and pre-state-bound", () => {
  assert.match(adapter, /process\.execPath,\s*\["--test"\]/);
  assert.match(adapter, /ACTIONSELF_ALLOWED_TEST_ROOTS/);
  assert.match(adapter, /ACTIONSELF_TEST_HEAD_DRIFT/);
  assert.match(adapter, /ACTIONSELF_TEST_PRESTATE_DRIFT/);
  assert.doesNotMatch(adapter, /shell:\s*true/);
});
test("dispatcher refuses roots outside the independently configured allowlist", () => {
  assert.match(dispatcher, /ACTIONSELF_DISPATCH_ROOT_NOT_ADMITTED/);
  assert.match(dispatcher, /ACTIONSELF_ISSUER_PRIVATE_KEY_FILE/);
  assert.doesNotMatch(dispatcher, /ACTIONSELF_ALLOWED_TEST_ROOTS:\s*\[/);
});
