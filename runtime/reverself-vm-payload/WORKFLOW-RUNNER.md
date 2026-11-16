# OURSELFLOW PULL-0006 execution contract

## Inputs

- Dispatch: `dispatch/PULL-0006.json`
- Workflow: `runtime/reverself-vm-payload/WORKFLOW.json`
- Canonical DATASELF manifest, schema and build spec from the exact ref in the dispatch.

## Run

```sh
node run-workflow.mjs \
  --dispatch /path/to/PULL-0006.json \
  --workflow /path/to/WORKFLOW.json \
  --manifest /path/to/manifest.json \
  --build-spec /path/to/build-spec.json \
  --schema /path/to/ourself-vm-payload.v1.schema.json \
  --receipt-dir ./receipts
```

The orchestrator validates the dispatch, authority label, scope, source binding, workflow identity, step order and prohibited-effect list. It then invokes only the fixed local manifest validator as a child process. Workflow JSON cannot supply shell commands or arbitrary executables.

The validator emits a child receipt. The orchestrator re-reads and checks that receipt, then emits a separate workflow receipt using exclusive-create, fsync, read-back and canonical SHA-256 verification.

## Evidence semantics

A successful run means only:

- Dispatch and workflow declarations are internally bound.
- The manifest/build-spec invariant checks passed.
- The local workflow and validation receipts were persisted and digest-checked.

It does **not** mean the VM payload was materialized, installer media acquired, runtime installed, launch admitted, or guest booted.
