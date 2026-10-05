# ACTIONSELF v0.1

ACTIONSELF is the executable-transition counterpart to ADDRESSSELF.

ADDRESSSELF answers WHERE IS THE ADDRESSABLE INSTANCE?
ACTIONSELF answers WHERE IS THE EXECUTABLE TRANSITION SURFACE AND WHAT EXACT JOB MAY IT ADMIT?

Canonical coordinate:
action://ourself.ecosystem/{owner}/{repo}@{instance_hash}#{surface}

The coordinate establishes an execution surface reference. It does not grant authority.

Every ACTION_DISPATCH request MUST contain:
request_type, target_ref, location_hint, frequency, issuer_ref, authority_ref, job_type, payload_ref, nonce.

location_hint routes the request.
frequency specifies cadence.
Neither is authority.

Execution membrane:
REQUEST -> ADDRESSSELF -> IDENTITYSELF -> ADMISSIONSELF -> AUTHORITYSELF -> CAPABILITYSELF -> ACTIONSELF -> EFFECTSELF -> RECEIPTSELF

The Action Node MUST fail closed if signature, issuer, authority, job type, target, or nonce validation fails.

Signature uses Ed25519 verification over the canonical JSON envelope. Signature proves issuer authenticity only. It does not itself prove authority.

Superbin IR v0.1 is typed data:
ir_version, job_type, target_ref, instructions, inputs.

Instructions are data until an explicit job adapter admits them. They are never arbitrary shell by default.

A successful run produces ExecutionReceipt with:
receipt_type, target_ref, issuer_ref, authority_ref, job_type, nonce, started_at, completed_at, result, external_effect, execution_sha256.

A receipt is evidence of observed execution. It is not authority.
