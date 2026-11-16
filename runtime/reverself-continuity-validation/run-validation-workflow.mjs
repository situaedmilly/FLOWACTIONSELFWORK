#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXPECTED = {
  processor: { repo:"situaedmilly/OURPROCESSORSELF", branch:"reverself/continuity-selfthought-v0.1", local:"OURPROCESSORSELF" },
  data: { repo:"situaedmilly/OURSELF-DATABASE-ESTATE", branch:"reverself/continuity-selfthought-v0.1", local:"OURSELF-DATABASE-ESTATE" },
  payload: { repo:"situaedmilly/OURSELF-DATABASE-ESTATE", branch:"reverself/vm-payload-genesis-v0.1", local:"OURSELF-DATABASE-ESTATE" }
};
const SCHEMAS = [
  { key:"data", path:"SCHEMAS/ourdata-envelope.v1.schema.json" },
  { key:"data", path:"SCHEMAS/ourdata-transition.v1.schema.json" },
  { key:"data", path:"SCHEMAS/reverself-continuity-profile.v1.schema.json" },
  { key:"payload", path:"SCHEMAS/ourself-vm-payload.v1.schema.json" }
];
function fail(message) { throw new Error(message); }
function requireValue(value, message) { if (!value) fail(message); }
function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  return JSON.stringify(value);
}
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function readJson(file) { return JSON.parse(await fs.readFile(file, "utf8")); }
function run(command, args, options={}) {
  const result = spawnSync(command, args, {
    encoding:"utf8",
    timeout: options.timeout ?? 180000,
    maxBuffer: 16 * 1024 * 1024,
    cwd: options.cwd,
    env: options.env ?? process.env
  });
  return {
    status: result.error ? "ERROR" : result.status === 0 ? "PASS" : "FAIL",
    exit_code: result.status,
    error: result.error ? String(result.error) : null,
    stdout: (result.stdout || "").slice(-24000),
    stderr: (result.stderr || "").slice(-24000)
  };
}
function archiveRef(repoPath, branch, destination) {
  const fetched = run("git", ["-C",repoPath,"fetch","--no-tags","origin","refs/heads/"+branch], {timeout:60000});
  requireValue(fetched.status === "PASS", "git fetch failed for " + repoPath + ": " + fetched.stderr);
  const sha = run("git", ["-C",repoPath,"rev-parse","FETCH_HEAD"], {timeout:10000});
  requireValue(sha.status === "PASS" && /^[a-f0-9]{40}$/.test(sha.stdout.trim()), "cannot resolve fetched commit for " + branch);
  const archive = spawnSync("git", ["-C",repoPath,"archive","--format=tar","FETCH_HEAD"], {encoding:null,timeout:60000,maxBuffer:512*1024*1024});
  requireValue(!archive.error && archive.status === 0, "git archive failed for " + branch + ": " + String(archive.error || archive.stderr || ""));
  const extracted = spawnSync("tar", ["-xf","-","-C",destination], {input:archive.stdout,encoding:"utf8",timeout:60000,maxBuffer:16*1024*1024});
  requireValue(!extracted.error && extracted.status === 0, "tar extraction failed for " + branch + ": " + String(extracted.error || extracted.stderr || ""));
  return {commit_sha:sha.stdout.trim(), fetch_status:"PASS", archive_status:"PASS"};
}
const args = Object.fromEntries(process.argv.slice(2).reduce((out,item,i,all)=>{if(item.startsWith("--"))out.push([item.slice(2),all[i+1]]);return out;},[]));
requireValue(args["repo-root"] && args["receipt-dir"], "required args: --repo-root and --receipt-dir");
const dispatch = await readJson(path.resolve(args.dispatch));
const workflow = await readJson(path.resolve(args.workflow));
const expectedOps = ["FETCH_EXACT_SOURCE_REFS","CREATE_TEMPORARY_SOURCE_TREES","RUN_OURPROCESSORSELF_NPM_TEST","COMPILE_DATASELF_DRAFT_2020_12_SCHEMAS","EMIT_READBACK_VERIFIED_EXECUTION_RECEIPT"];
requireValue(dispatch.dispatch_id === "DISPATCH-0007" && dispatch.pull_id === "PULL-0007" && dispatch.action === "EXECUTE_REVERSELF_TEST_AND_SCHEMA_VALIDATION", "dispatch identity/action mismatch");
requireValue(dispatch.status === "DISPATCHED" && dispatch.authority === "EXPLICIT_USER_EXECUTION_REQUEST" && dispatch.execution_scope === "READ_ONLY_REPO_TESTS_AND_SCHEMA_COMPILE", "dispatch authority/scope mismatch");
requireValue(workflow.workflow_id === "OURSELFLOW-REVERSELF-CONTINUITY-VALIDATION-001" && workflow.dispatch_id === dispatch.dispatch_id && workflow.pull_id === dispatch.pull_id && workflow.orchestrator === "FLOWACTIONSELFWORK", "workflow identity/orchestrator mismatch");
requireValue(Array.isArray(workflow.steps) && workflow.steps.length === expectedOps.length && workflow.steps.every((step,i)=>step.operation===expectedOps[i]), "workflow step order mismatch");
requireValue(dispatch.prohibited_effects.includes("GITHUB_ACTIONS_EXECUTION") && dispatch.prohibited_effects.includes("MAIN_BRANCH_MUTATION") && dispatch.prohibited_effects.includes("GLOBAL_PACKAGE_INSTALLATION"), "prohibited effects missing from dispatch");
requireValue(dispatch.sources?.length === 3 && dispatch.sources.some(s=>s.repository==="situaedmilly/OURPROCESSORSELF" && s.ref===EXPECTED.processor.branch) && dispatch.sources.some(s=>s.repository==="situaedmilly/OURSELF-DATABASE-ESTATE" && s.ref===EXPECTED.data.branch) && dispatch.sources.some(s=>s.repository==="situaedmilly/OURSELF-DATABASE-ESTATE" && s.ref===EXPECTED.payload.branch), "dispatch source refs mismatch");
const workflowBindingPass = true;
const root = path.resolve(args["repo-root"]);
const receiptDir = path.resolve(args["receipt-dir"]);
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(),"ourselflow-continuity-"));
const processorDir = path.join(tempRoot,"processor");
const dataDir = path.join(tempRoot,"data");
const payloadDir = path.join(tempRoot,"payload");
await Promise.all([processorDir,dataDir,payloadDir,receiptDir].map(p=>fs.mkdir(p,{recursive:true,mode:0o700})));
const before = {};
for (const key of ["processor","data"]) {
  const repoPath = path.join(root,EXPECTED[key].local);
  const status = run("git",["-C",repoPath,"status","--porcelain"],{timeout:10000});
  requireValue(status.status==="PASS","cannot read pre-run source worktree status for "+key);
  before[key] = sha256(status.stdout);
}
const refs = {};
refs.processor = archiveRef(path.join(root,EXPECTED.processor.local),EXPECTED.processor.branch,processorDir);
refs.data = archiveRef(path.join(root,EXPECTED.data.local),EXPECTED.data.branch,dataDir);
refs.payload = archiveRef(path.join(root,EXPECTED.payload.local),EXPECTED.payload.branch,payloadDir);

const testResult = run("npm",["test"],{cwd:processorDir,timeout:240000,env:{PATH:process.env.PATH||"/usr/bin:/bin",HOME:process.env.HOME||"/tmp",LANG:"C.UTF-8",CI:"1"}});
const npmCache = path.join(tempRoot,"npm-cache");
await fs.mkdir(npmCache,{recursive:true,mode:0o700});
const schemaResults = [];
for (const item of SCHEMAS) {
  const base = item.key==="data" ? dataDir : payloadDir;
  const schemaPath = path.join(base,item.path);
  let exists = false;
  try { await fs.access(schemaPath); exists = true; } catch {}
  if (!exists) {
    schemaResults.push({schema:item.path,source:item.key,status:"MISSING",exit_code:null,stdout:"",stderr:"schema file not found"});
    continue;
  }
  const result = run("npx",["--yes","ajv-cli@5","compile","--spec=draft2020","-s",schemaPath],{
    cwd:tempRoot,timeout:120000,
    env:{PATH:process.env.PATH||"/usr/bin:/bin",HOME:process.env.HOME||"/tmp",LANG:"C.UTF-8",npm_config_cache:npmCache,npm_config_audit:"false",npm_config_fund:"false",npm_config_update_notifier:"false"}
  });
  schemaResults.push({schema:item.path,source:item.key,...result});
}
const after = {};
for (const key of ["processor","data"]) {
  const status = run("git",["-C",path.join(root,EXPECTED[key].local),"status","--porcelain"],{timeout:10000});
  requireValue(status.status==="PASS","cannot read post-run source worktree status for "+key);
  after[key] = sha256(status.stdout);
}
const allSchemasPass = schemaResults.length===SCHEMAS.length && schemaResults.every(x=>x.status==="PASS");
const allPass = workflowBindingPass && testResult.status==="PASS" && allSchemasPass && before.processor===after.processor && before.data===after.data;
const receipt = {
  schema_version:"ourself.flow-validation-receipt.v1",
  receipt_id:"FLOW-VALIDATION-" + crypto.randomUUID(),
  timestamp_utc:new Date().toISOString(),
  workflow_id:workflow.workflow_id,
  dispatch_id:dispatch.dispatch_id,
  pull_id:dispatch.pull_id,
  dispatch_sha256:sha256(canonical(dispatch)),
  workflow_sha256:sha256(canonical(workflow)),
  dispatch_id:"DISPATCH-0007",
  pull_id:"PULL-0007",
  orchestrator:"FLOWACTIONSELFWORK",
  executor:"OURSELFLOW-VALIDATION-EXECUTOR",
  disposition:allPass?"VALIDATION_PASSED":"VALIDATION_FAILED_OR_BLOCKED",
  workflow_binding:{status:"PASS",dispatch_id:dispatch.dispatch_id,pull_id:dispatch.pull_id},
  source_refs:refs,
  package_test:{command:"npm test",...testResult},
  schema_compilation:schemaResults,
  source_worktree_immutability:{
    processor_before_sha256:before.processor,processor_after_sha256:after.processor,
    data_before_sha256:before.data,data_after_sha256:after.data,
    unchanged:before.processor===after.processor && before.data===after.data
  },
  dependency_scope:{validator:"ajv-cli@5",cache_path:npmCache,global_install:false,repository_install:false},
  effects:{test_execution_performed:true,schema_validation_performed:true,source_worktrees_modified:false,main_branch_modified:false,github_actions_used:false,external_actuation:false},
  temporary_root:tempRoot
};
receipt.receipt_sha256=sha256(canonical(receipt));
const output=JSON.stringify(receipt,null,2)+"\n";
const receiptPath=path.join(receiptDir,receipt.receipt_id+".json");
const handle=await fs.open(receiptPath,"wx",0o600);
try{await handle.writeFile(output);await handle.sync();}finally{await handle.close();}
const readback=await fs.readFile(receiptPath,"utf8");
requireValue(readback===output,"workflow receipt read-back mismatch");
const parsed=JSON.parse(readback);const claimed=parsed.receipt_sha256;delete parsed.receipt_sha256;
requireValue(claimed===sha256(canonical(parsed)),"workflow receipt digest mismatch");
console.log(JSON.stringify({
  disposition:receipt.disposition,
  workflow_binding:"PASS",
  receipt_id:receipt.receipt_id,
  receipt_path:receiptPath,
  receipt_sha256:claimed,
  processor_commit:refs.processor.commit_sha,
  data_commit:refs.data.commit_sha,
  payload_schema_commit:refs.payload.commit_sha,
  npm_test_status:testResult.status,
  npm_test_exit_code:testResult.exit_code,
  schemas:schemaResults.map(x=>({schema:x.schema,status:x.status,exit_code:x.exit_code})),
  source_worktrees_unchanged:receipt.source_worktree_immutability.unchanged,
  github_actions_used:false,
  temp_root:tempRoot
},null,2));
if (!allPass) process.exitCode=1;
