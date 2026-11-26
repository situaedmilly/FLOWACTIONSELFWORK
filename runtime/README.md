# GPTSELFSEATC Runtime

This directory defines the callable seat contract for GPTSELF-C.

BOOTED_READY means the seat runtime is materialized and can inspect DISPATCH-0003. It does not mean GATE-0003 executed.

Required execution sequence:

RECEIVE -> BIND -> EXECUTE -> GATE-0003 -> PUSH-0003 -> RECEIPT -> THIRD-EYE RECONTACT -> BYTE MATCH -> VERIFIED_PUSH.

No file in this runtime may fabricate PUSH-0003, EFFECT-0004, or GATE-COMPLETION-0003.

## ProtocolSELF Registry Boot

The GPTSELF-C seat boot now loads the pinned OURSELFCOMM ProtocolSELF-18 registry through `protocolself-registry.mjs`. The boot receipt records 18 identities and zero listeners. This does not execute PULL-0003 or grant network transport authority. See `../PROTOCOLSELF-18-BOOT.md`.
