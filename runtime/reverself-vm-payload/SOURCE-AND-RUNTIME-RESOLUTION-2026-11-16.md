# REVERSELF Windows ARM64 source and runtime resolution — 2026-11-16

## Official installer source resolved

Microsoft provides a dedicated Windows 11 Arm download page:

- https://www.microsoft.com/en-us/software-download/windows11arm64
- Microsoft Learn overview: https://learn.microsoft.com/en-us/windows/arm/iso

The Microsoft download page currently identifies Windows 11 2026 Update, version 26H2. It explicitly describes the Arm64 ISO as suitable for creating Windows 11 on Arm virtual machines on supported hardware. The ISO is multi-edition and uses the applicable product key to unlock the correct edition. Microsoft also provides a post-download integrity verification flow and locale-specific SHA-256 values.

The ISO has **not** been downloaded. The language, edition/product key and applicable license have not been confirmed. Therefore media status remains `NOT_ACQUIRED`.

## Host runtime inspection

Observed host: OURSELFMAC.local, Mac mini Mac16,10, Apple M4, arm64, macOS 27.0.1, 16 GiB RAM, 12 GiB available on the data volume.

The read-only inventory found:
- UTM: not installed
- Parallels Desktop: not installed
- VMware Fusion: not installed
- `qemu-system-aarch64`: not found on PATH
- Existing Windows ARM64 ISO or EDK2 AArch64 firmware: not found in the inspected Downloads and OURSELF paths (depth <= 4)

The Apple Virtualization framework's official overview describes support for macOS and Linux guest operating systems. It is not admitted here as a Windows 11 guest runtime based on the available official documentation.

UTM is a possible Windows-on-Apple-Silicon route, but its Windows 11 guide uses a VM creation workflow and its QEMU documentation exposes the TPM 2.0 and UEFI/Secure Boot configuration required for Windows 11. UTM is not installed on this host. Installing UTM or QEMU is outside the current execution authority; no installation was attempted.

## Current disposition

`OFFICIAL_MEDIA_SOURCE_RESOLVED`
`MEDIA_NOT_ACQUIRED`
`RUNTIME_UNRESOLVED`
`BUILD_BLOCKED_PENDING_RUNTIME_AND_STORAGE`

No installer download, software installation, disk creation, firmware mutation, VM boot or launch admission has occurred.

## Next gates

1. Confirm the Windows edition/language and valid license or product key.
2. Resolve an already-installed, authorized ARM64 hypervisor, or explicitly authorize a specific runtime installation.
3. Resolve a storage target with adequate headroom for the installer ISO, guest tools, firmware, working disk and preservation copy.
4. Only then materialize the new guest disk and firmware artifacts.
