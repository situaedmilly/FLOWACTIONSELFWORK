import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requestPath = process.argv[2];

if (!requestPath) throw new Error("OURSELF_ACTION_RUNNER_REQUEST_REQUIRED");

execFileSync(
  process.execPath,
  [resolve(root, "exec.mjs"), requestPath],
  { stdio: "inherit" }
);

console.log("OURSELF_ACTION_RUNNER=EXECUTED");
console.log("EXECUTION_SUBSTRATE=FLOWACTIONSELFWORK");
console.log("GITHUB_ACTIONS=NOT_USED");
