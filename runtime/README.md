# GPTSELFSEATC Runtime

This directory defines the callable seat contract for GPTSELF-C.

BOOTED_READY means the seat runtime is materialized and can inspect DISPATCH-0003. It does not mean GATE-0003 executed.

Required execution sequence:

RECEIVE -> BIND -> EXECUTE -> GATE-0003 -> PUSH-0003 -> RECEIPT -> THIRD-EYE RECONTACT -> BYTE MATCH -> VERIFIED_PUSH.

No file in this runtime may fabricate PUSH-0003, EFFECT-0004, or GATE-COMPLETION-0003.
