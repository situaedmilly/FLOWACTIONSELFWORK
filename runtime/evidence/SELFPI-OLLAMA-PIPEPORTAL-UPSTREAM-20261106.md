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
