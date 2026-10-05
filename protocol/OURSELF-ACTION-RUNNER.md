# OURSELF ACTION RUNNER v0.1

## Jurisdiction

FLOWACTIONSELFWORK is the execution reality.

GitHub is limited to:
- repository transport
- source persistence
- immutable commit history
- dispatch signaling when used as a transport surface
- witness storage when explicitly copied back by the sovereign runner

GitHub Actions is NOT an execution substrate.

## Runner boundary

The sovereign runner is:

`OURSELF_ACTION_RUNNER`

It is responsible for:

REQUEST
-> VERIFY
-> ADMIT
-> ACTUATE
-> OBSERVE
-> RECEIPT

The runner MUST:
- execute inside the Action Node jurisdiction
- load the Action Node manifest
- invoke `exec.mjs`
- preserve request_type, location_hint, and frequency
- fail closed on invalid signature, issuer, authority, capability, action, target, or nonce
- write effects and receipts only to declared local surfaces
- report the resulting receipt to the transport layer without delegating execution

The runner MUST NOT:
- call GitHub Actions
- require a GitHub-hosted runner
- treat a GitHub workflow result as execution evidence
- equate repository_dispatch with actuation
- grant authority merely because a request arrived through GitHub

## First witness

The first witness is the deterministic local adapter:

`ACTUATIONSELF/DETERMINISTIC_BUILD`

Its effect is deliberately local and non-external.

A successful local run proves:

ACTIONSELF = ADMITTED
ACTUATIONSELF = EXECUTED
EFFECTSELF = OBSERVED
RECEIPTSELF = PROVEN

Only the local runner's direct receipt and effect bytes may promote those states.
