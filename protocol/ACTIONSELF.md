# ACTIONSELF v0.2

FLOWACTIONSELFWORK is the sovereign execution reality. GitHub is transport and source custody only. GitHub Actions and hosted runners are prohibited execution substrates.

The Action Node verifies a signed Ed25519 ACTION_DISPATCH envelope, fixed issuer, job-specific authority, typed action, nonce, and capability before actuation.

## Typed adapters

- DETERMINISTIC_BUILD: the existing bounded local deterministic effect.
- TEST_SUITE: ACTUATIONSELF/FULL_REPOSITORY_TEST_SUITE invokes only process.execPath --test with shell:false.

TEST_SUITE requires an allowlisted target and control-plane root, expected Git HEAD, and SHA-256 pre-run worktree fingerprint. It does not accept arbitrary shell commands or caller-supplied argv. It captures TAP output, hashes logs/effects, and persists an ExecutionReceipt containing exact test/pass/fail counts and the pre-state.

A failure receipt is a failure; only zero exit, nonzero test inventory, and zero failed tests produce FULL_TEST_SUITE_PASSED. Tests may create local evidence or temporary files; external_effect=false means no external deployment/publication, not no local mutation.

Issuer private key remains local. GitHub Actions are never invoked.
