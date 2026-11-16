# OURSELFLOW Runtime-Symmetric Storage

This workflow validates the universal DATASELF storage contract and the processor's local adapter implementation. It fetches exact source refs into temporary trees, runs the processor test suite, compiles Draft 2020-12 schemas, and records host inventory. It never provisions canonical storage, replicates payloads, creates credentials, installs a hypervisor, or boots a VM.

The runtime matrix is intentionally broader than the adapters currently implemented. Platform-specific adapters remain CONTRACT_ONLY until they pass the exact conformance suite on their own runtime and receive independent admission.

Execution is through OURSELFLOW on OURSELFMAC.local. GitHub Actions is not used.
