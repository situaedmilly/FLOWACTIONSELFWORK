import fs from "node:fs/promises";
import crypto from "node:crypto";

const dispatchPath = new URL("../dispatch/PULL-0003.json", import.meta.url);
const dispatch = JSON.parse(await fs.readFile(dispatchPath, "utf8"));

const receipt = {
  receipt_id: "RECEIPT-GPTSELFSEATC-BOOT-0003",
  seat_id: "GPTSELFSEATC",
  runtime_id: "GPTSELF-C",
  dispatch_id: dispatch.dispatch_id,
  pull_id: dispatch.pull_id,
  gate_id: dispatch.gate_id,
  status: "BOOTED_READY",
  authority: dispatch.authority,
  execution_claim: false,
  next_required_transition: "RECEIVE_POLL-0003",
  nonce: crypto.randomUUID(),
  note: "Seat boot is recorded. PULL-0003 execution remains a separate causal event."
};

console.log(JSON.stringify(receipt, null, 2));
