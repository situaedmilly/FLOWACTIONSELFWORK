# OURSELF ACTION RUNNER v0.2

OURSELF_ACTION_RUNNER performs REQUEST → VERIFY → ADMIT → ACTUATE → OBSERVE → RECEIPT locally in FLOWACTIONSELFWORK.

The TEST_SUITE dispatcher signs a typed request with the local Ed25519 issuer key and invokes the sovereign runner. The adapter checks the target/control-plane allowlist, expected Git HEAD, and pre-run worktree hash, then invokes process.execPath --test with shell:false.

The dispatcher accepts only repository roots, never arbitrary commands or argv. The runner records TAP logs, counts, effect hash, and receipt. GitHub Actions, hosted runners, arbitrary shell, and unbound target roots remain prohibited.
