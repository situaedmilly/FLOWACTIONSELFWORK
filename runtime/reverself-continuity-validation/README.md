# OURSELFLOW continuity validation workflow

PULL-0007 replaces the previously drafted GitHub Actions test and schema workflows.

## Execution

`run-validation-workflow.mjs` is the bounded executor. It requires the exact dispatch and workflow declarations, validates their source refs and prohibited-effect policy, fetches each source branch, and extracts the fetched commit with `git archive` into temporary directories.

It then runs:

1. `npm test` in the temporary OURPROCESSORSELF source tree.
2. AJV CLI 5 Draft 2020-12 compilation for the three canonical DATASELF schemas and the new VM payload schema.

AJV is invoked through `npx` with its npm cache isolated under the temporary workflow directory. No global or repository dependency installation is performed.

## Safety

- No checkout or reset of the existing local source worktrees.
- No source branch or main branch mutation.
- No source repository file changes.
- No GitHub Actions.
- No QEMU installation, disk creation, firmware mutation or VM boot.
- Test and schema outcomes are recorded even if one validation fails.

## Receipt

The runner writes an exclusive-create receipt, fsyncs it, reads it back byte-for-byte, verifies its canonical SHA-256, and reports the exact source commit SHAs and each validation result.
