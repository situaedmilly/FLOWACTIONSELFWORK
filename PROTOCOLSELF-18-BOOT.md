# ProtocolSELF-18 Ecosystem Boot Projection

Source registry: `situaedmilly/self-communication`, branch
`feat/protocolself-18-registry-v0.1`, path
`protocols/protocolself-18.v0.1.json`.

Source registry SHA-256:
`76a2a14c9bab0d0ded7ff05c80991141df53e9f1f15ec948443e0b950017508c`

Consumer role: Execution orchestration and runtime work surface; protocol selection remains downstream of bounded authorization.

This additive projection carries the same 18 protocol identities and conventional
port metadata. It does not create service instances, listeners, firewall rules,
DNS/Cloudflare routes, credentials, or multi-node transport.

Boot disposition:
- Registry definitions: PRESENT (18)
- Listener activation: DISABLED
- External binding: PROHIBITED
- Network transport authority: NOT_GRANTED
- Multi-node exchange: NOT_AUTHORIZED
- Credentials: NEVER_EMBEDDED
- Admission: REQUIRED_PER_PROTOCOL_AND_INSTANCE

Reconcile this copy against the source digest before use. Protocol identity is
not service identity; service identity is not listener; listener is not
reachability; reachability is not authorization; transport is not admission.

Telnet TCP/23 and TFTP UDP/69 remain prohibited-insecure. Every other service
requires its own endpoint identity, transport security, credential custody,
jurisdiction, and admission preflight before activation.
