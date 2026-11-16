import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = process.argv[2];
const RECEIPT_DIR = process.argv[3];
if (!ROOT || !RECEIPT_DIR) throw new Error("Usage: node run-workflow.mjs <workspace-root> <receipt-directory>");
const specs = {
  processor: { repo:"OURPROCESSORSELF", branch:"architecture/runtime-symmetric-storage-v0.1" },
  data: { repo:"OURSELF-DATABASE-ESTATE", branch:"architecture/runtime-symmetric-storage-v0.1" }
};
const schemaPaths = [
  "SCHEMAS/ourdata-envelope.v1.schema.json",
  "SCHEMAS/ourdata-transition.v1.schema.json",
  "SCHEMAS/storage-adapter-registration.v1.schema.json"
];
const temp = await fs.mkdtemp(path.join(os.tmpdir(),"ourselflow-runtime-storage-"));
const npmCache = path.join(temp,"npm-cache");
await fs.mkdir(npmCache,{recursive:true,mode:0o700});
await fs.mkdir(RECEIPT_DIR,{recursive:true,mode:0o700});
const sha = (v) => crypto.createHash("sha256").update(v).digest("hex");
function run(command,args,options={}) {
  const r=spawnSync(command,args,{cwd:options.cwd,encoding:"utf8",timeout:options.timeout??180000,maxBuffer:24*1024*1024,env:options.env??process.env});
  return {status:r.error?"ERROR":r.status===0?"PASS":"FAIL",exit_code:r.status,error:r.error?String(r.error):null,stdout:(r.stdout||"").slice(-32000),stderr:(r.stderr||"").slice(-16000)};
}
function requirePass(r,label){if(r.status!=="PASS")throw new Error(label+" failed: "+(r.stderr||r.error||r.stdout));}
async function worktreeDigest(repo) {
  const listed=spawnSync("git",["-C",repo,"ls-files","-co","--exclude-standard","-z"],{encoding:null,timeout:30000,maxBuffer:32*1024*1024});
  if(listed.error||listed.status!==0)throw new Error("cannot enumerate worktree files: "+repo);
  const names=listed.stdout.toString("utf8").split("\\0").filter(Boolean).sort();
  const hash=crypto.createHash("sha256");
  let fileCount=0;
  for(const name of names){
    const full=path.join(repo,name);
    const stat=await fs.lstat(full);
    hash.update(Buffer.from(name,"utf8"));hash.update(Buffer.from([0]));
    if(stat.isSymbolicLink()){hash.update(Buffer.from("SYMLINK:"));hash.update(Buffer.from(await fs.readlink(full),"utf8"));}
    else if(stat.isFile()){hash.update(Buffer.from("FILE:"));hash.update(await fs.readFile(full));}
    else {hash.update(Buffer.from("OTHER:"+stat.mode));}
    hash.update(Buffer.from([0]));fileCount++;
  }
  return {sha256:hash.digest("hex"),file_count:fileCount};
}
async function archive(name) {
  const spec=specs[name], repo=path.join(ROOT,spec.repo), target=path.join(temp,name);
  await fs.mkdir(target);
  const before=run("git",["-C",repo,"status","--porcelain"]);requirePass(before,"pre-run worktree status "+name);\n  const beforeContent=await worktreeDigest(repo);
  const fetch=run("git",["-C",repo,"fetch","--no-tags","origin","refs/heads/"+spec.branch],{timeout:60000});requirePass(fetch,"fetch "+name);
  const rev=run("git",["-C",repo,"rev-parse","FETCH_HEAD"]);requirePass(rev,"resolve commit "+name);
  const archive=spawnSync("git",["-C",repo,"archive","--format=tar","FETCH_HEAD"],{encoding:null,timeout:60000,maxBuffer:512*1024*1024});
  if(archive.error||archive.status!==0)throw new Error("archive failed "+name);
  const extract=spawnSync("tar",["-xf","-","-C",target],{input:archive.stdout,encoding:"utf8",timeout:60000});
  if(extract.error||extract.status!==0)throw new Error("extract failed "+name);
  return {repo:spec.repo,branch:spec.branch,commit_sha:rev.stdout.trim(),target,before_status_sha256:sha(before.stdout),before_content:beforeContent,repoPath:repo};
}
const sources={processor:await archive("processor"),data:await archive("data")};
const npmTest=run("npm",["test"],{cwd:sources.processor.target,timeout:240000,env:{PATH:process.env.PATH||"/usr/bin:/bin",HOME:process.env.HOME||"/tmp",LANG:"C.UTF-8",CI:"1"}});
const schemas=[];
for(const schema of schemaPaths){
 const file=path.join(sources.data.target,schema);
 await fs.access(file);
 const result=run("npx",["--yes","--package=ajv-cli@5","--package=ajv-formats@3","ajv","compile","--spec=draft2020","-c","ajv-formats","-s",file],{cwd:temp,timeout:120000,env:{PATH:process.env.PATH||"/usr/bin:/bin",HOME:process.env.HOME||"/tmp",LANG:"C.UTF-8",npm_config_cache:npmCache,npm_config_audit:"false",npm_config_fund:"false",npm_config_update_notifier:"false"}});
 schemas.push({schema,status:result.status,exit_code:result.exit_code,stdout:result.stdout,stderr:result.stderr});
}
const inventory={
 runtime_kind:process.platform==="darwin"?"MACOS":process.platform==="linux"?"LINUX":process.platform,
 host_architecture:os.arch(),kernel:os.release(),node:process.version,
 executables:Object.fromEntries(["docker","colima","limactl","qemu-system-aarch64","qemu-img","prlctl","podman","containerd","ollama"].map(name=>[name,run("which",[name]).status==="PASS"])),
 available_storage_kib:run("df",["-k",ROOT]).stdout.trim().split("\n").at(-1),
 container_runtime_observation:run("docker",["info","--format","{{.ServerVersion}}"],{timeout:5000}).status,
 colima_observation:run("colima",["status"],{timeout:5000}).status,
 lima_observation:run("limactl",["list"],{timeout:5000}).status,
 ollama_observation:run("ollama",["list"],{timeout:5000}).status
};
const after={};
for(const name of ["processor","data"]){
 const repo=path.join(ROOT,specs[name].repo);
 const status=run("git",["-C",repo,"status","--porcelain"]);requirePass(status,"post-run worktree status "+name);
 after[name]={status_sha256:sha(status.stdout),content:await worktreeDigest(repo)};
}
const unchanged=after.processor.content.sha256===sources.processor.before_content.sha256&&after.data.content.sha256===sources.data.before_content.sha256;
const allPass=npmTest.status==="PASS"&&schemas.length===schemaPaths.length&&schemas.every(x=>x.status==="PASS")&&unchanged;
const receipt={
 schema_version:"ourself.flow-runtime-storage-receipt.v1",
 receipt_id:"FLOW-STORAGE-"+crypto.randomUUID(),
 observed_at:new Date().toISOString(),
 workflow_id:"OURSELFLOW-RUNTIME-SYMMETRIC-STORAGE-001",
 dispatch_id:"DISPATCH-0008",pull_id:"PULL-0008",
 disposition:allPass?"VALIDATION_PASSED":"VALIDATION_FAILED",
 source_refs:{processor:{repository:sources.processor.repo,branch:sources.processor.branch,commit_sha:sources.processor.commit_sha},data:{repository:sources.data.repo,branch:sources.data.branch,commit_sha:sources.data.commit_sha}},
 processor_test:{command:"npm test",status:npmTest.status,exit_code:npmTest.exit_code,stdout:npmTest.stdout,stderr:npmTest.stderr},
 schema_compilation:schemas,
 host_runtime_inventory:inventory,
 source_worktree_immutability:{method:"SHA-256 over sorted tracked and non-ignored untracked worktree file paths and exact file bytes; .git metadata excluded",processor_before:sources.processor.before_content,processor_after:after.processor.content,data_before:sources.data.before_content,data_after:after.data.content,processor_status_before:sources.processor.before_status_sha256,processor_status_after:after.processor.status_sha256,data_status_before:sources.data.before_status_sha256,data_status_after:after.data.status_sha256,unchanged},
 scope:{github_actions_used:false,main_mutated:false,source_worktrees_modified:false,global_install:false,repository_install:false,canonical_storage_provisioned:false,replication_performed:false,vm_disk_created:false,vm_booted:false},
 temporary_root:temp
};
const canonical=(v)=>Array.isArray(v)?"["+v.map(canonical).join(",")+"]":v&&typeof v==="object"?"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}":JSON.stringify(v);
receipt.receipt_sha256=sha(canonical(receipt));
const text=JSON.stringify(receipt,null,2)+"\n";
const file=path.join(RECEIPT_DIR,receipt.receipt_id+".json");
const handle=await fs.open(file,"wx",0o600);
try{await handle.writeFile(text);await handle.sync();}finally{await handle.close();}
const readback=await fs.readFile(file,"utf8");
if(readback!==text)throw new Error("receipt readback mismatch");
const check=JSON.parse(readback),claimed=check.receipt_sha256;delete check.receipt_sha256;
if(sha(canonical(check))!==claimed)throw new Error("receipt digest mismatch");
console.log(JSON.stringify({disposition:receipt.disposition,receipt_id:receipt.receipt_id,receipt_path:file,receipt_sha256:claimed,processor_commit:sources.processor.commit_sha,data_commit:sources.data.commit_sha,npm_test_status:npmTest.status,schema_results:schemas.map(x=>({schema:x.schema,status:x.status})),host_runtime_inventory:inventory,source_worktrees_unchanged:unchanged},null,2));
if(!allPass)process.exitCode=1;
