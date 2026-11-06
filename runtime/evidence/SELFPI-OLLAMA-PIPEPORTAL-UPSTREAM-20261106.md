# SELFPI Ollama → PipePortal upstream evidence

**Observed:** 2026-11-06  
**Standing:** MODEL TRANSPORT VERIFIED · ADMIN AUTHORITY NOT ESTABLISHED

## Cognition endpoint path

- SELFPI Ollama listener: `127.0.0.1:11434` on the Pi.
- Pi-initiated SSH reverse forward: `127.0.0.1:11435` on the Mac → Pi `127.0.0.1:11434`.
- PipePortal Mac runtime: `127.0.0.1:49320`.
- PipePortal's configured canonical SELFPI upstream: `http://127.0.0.1:11435`.

The SSH transport uses an existing, previously authorized Pi key and a loopback-only remote forward. A Pi-side watchdog is installed and registered in the user crontab for boot-time reconnection.

## Observed model inventory

Mac-side requests through `http://127.0.0.1:11435` returned HTTP 200 for both `/api/tags` and `/v1/models`.

Models observed:
- `ourmodelselfgenesis:latest`
- `hf.co/ISTA-DASLab/Qwen3.8-27B-GSQ-RCO-GGUF:IQ2_S`

This proves the model inventory endpoint is reachable through the tunnel. It does not by itself prove a successful inference completion, model sovereignty, or administrative authority.

## Explicit non-equivalences

- Reachable Ollama endpoint ≠ PORTAL trust.
- Model inventory ≠ verified cognition receipt.
- SSH transport ≠ PORTAL admission.
- A live model process ≠ host-admin authorization.

## Authority and security status

- Independent PORTAL trust root: NOT CONFIGURED.
- Trust bundle: NOT VERIFIED.
- Host-admin pipe: NOT CONFIGURED.
- Direct Mac-to-Pi TCP 22: FILTERED.
- Firewall changes: NONE.
- New keys or root identities generated: NONE.
- Raw SSH shell tunnel retained as a PORTAL substitute: NO.

**Disposition:** SELFPI's Ollama HTTP API is reachable by the Mac's loopback-only canonical upstream. No execution authority or host administration is conferred by this transport.


## REVERSELF configuration implementation and verification (2026-11-06)

Implemented on OURSELFMAC in `runtime/aetherbridge/`:

- `config/pipeportal-reverself-config.v1.json`: explicit six-fact reconciliation contract and run-change ledger.
- `portal-reverself-preflight.mjs`: live read-only verifier. It reads PipePortal `/healthz`, probes direct OURSELFMAC → OURSELFPIMAC TCP/22 independently of the reverse Ollama tunnel, and emits a six-fact JSON report.
- Report path from this run: `/tmp/portal-rever-self-preflight.json` (ephemeral verification output, not authority evidence).

Six facts observed independently:
1. Independent PORTAL root: **NOT_CONFIGURED**.
2. INPUTSELFTRUSTSELF bundle + authority lineage: **NOT_VERIFIED**.
3. mTLS host-admin pipe: **NOT_CONFIGURED** (reason: `PORTAL_TRUST_UNVERIFIED`).
4. Direct Mac → Pi TCP/22: **FILTERED_OR_UNREACHABLE** (connect timed out). This does not contradict the working reverse Ollama API tunnel.
5. Firewall policy: **NO_CHANGE_BY_THIS_RUN**.
6. New keys/root identities: **NONE_CREATED_BY_THIS_RUN**; no raw SSH shell tunnel created.

Verification:
- PipePortal health: `LIVE`, PID `6056`.
- Preflight correctly returned `FAIL_CLOSED_TRUST_OR_HOST_ADMIN_PRECONDITIONS_UNSATISFIED` and exit code `2`; this is the expected negative result while independent trust evidence is absent.
- Existing AetherBridge + host-admin tests: **45 passed, 0 failed**.
- JavaScript syntax check: passed.

No production trust values were fabricated. No launchd trust environment, service source, firewall, SSH policy, keys, or authority records were mutated. No default-branch update, PR, or merge was performed. Transport remains distinct from trust, admission, and host administration.
