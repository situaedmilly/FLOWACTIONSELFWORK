# REVERSELF Windows ARM64 VM Payload Genesis

This workflow declares a new VM payload. It does not recover or reuse the historical VM.

## Authority and orchestration

- Orchestrator: `situaedmilly/FLOWACTIONSELFWORK`
- Dispatch: `dispatch/PULL-0006.json`
- Workflow: `runtime/reverself-vm-payload/WORKFLOW.json`
- Canonical manifest and build specification: `situaedmilly/OURSELF-DATABASE-ESTATE`, branch `reverself/vm-payload-genesis-v0.1`
- Validator: `validate-manifest.mjs`

GitHub Actions is not used as the workflow execution engine. The workflow is dispatched and evidenced through OURSELFLOW.

## Current declared target

- Guest: Windows 11 ARM64 / AArch64
- Firmware: EDK2 AArch64 UEFI, Secure Boot enabled
- TPM: 2.0
- Compute: 4 vCPU, 8 GiB RAM
- Storage: new 128 GiB sparse RAW virtual disk
- Payload identity: `REVERSELF-WINARM64-GENESIS-001`

## Validate the declaration

Run with Node.js 18 or later, passing the canonical DATASELF files:

```sh
node validate-manifest.mjs \
  --manifest /path/to/OURSELF-DATABASE-ESTATE/VM_PAYLOADS/REVERSELF-WINARM64-GENESIS-001/manifest.json \
  --build-spec /path/to/OURSELF-DATABASE-ESTATE/VM_PAYLOADS/REVERSELF-WINARM64-GENESIS-001/build-spec.json \
  --schema /path/to/OURSELF-DATABASE-ESTATE/SCHEMAS/ourself-vm-payload.v1.schema.json \
  --receipt-dir ./receipts
```

The validator checks manifest identity, component-role coverage, build order, runtime boundaries and admission state. It emits an exclusive-create, read-back-verified receipt. The validator performs invariant checks against the schema declaration; it is not a general-purpose JSON Schema engine.

## Execution boundary

The first workflow scope is read-only declaration validation plus a local receipt write. It does not create a guest disk, acquire Windows media, install a hypervisor, mutate firmware, request launch admission, or boot a VM.

QEMU installation remains unauthorized. Runtime selection is deliberately unresolved until the existing host hypervisor can be inspected and compatibility established.

## Lifecycle

`DECLARED → SPECIFIED → ASSEMBLING → ASSEMBLED → INTEGRITY_VERIFIED → ADMITTED → BOOTED → OBSERVED → SEALED`

No later state may be asserted without the corresponding artifacts and evidence.
