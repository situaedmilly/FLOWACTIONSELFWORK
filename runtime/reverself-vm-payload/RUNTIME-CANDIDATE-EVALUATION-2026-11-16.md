# Runtime candidate evaluation — 2026-11-16

## Recommended QEMU-free candidate: Parallels Desktop 27

Parallels Desktop 27 is the strongest documented local candidate for this host:

- Host: Apple M4 / macOS 27.0.1.
- Parallels publishes Desktop 27 as compatible with macOS 27.
- Its current system requirements list Apple silicon M-series hosts, including M4, and Windows 11 Pro / Enterprise ARM guests.
- Parallels identifies Windows 11 Pro and Enterprise as the supported editions for its Microsoft-authorized Windows-on-Apple-silicon configuration.
- Parallels supports Secure Boot and a virtual TPM 2.0 for compatible Windows 11 VMs.
- Parallels virtual disks support an expanding format; the guest sees the declared capacity while host storage grows as data is written.

Official references:
- https://www.parallels.com/products/desktop/download/
- https://www.parallels.com/blogs/parallels-desktop-27
- https://kb.parallels.com/en/124223
- https://www.parallels.com/products/desktop/microsoft-authorized-solution-windows-11-arm/
- https://kb.parallels.com/en/4706
- https://kb.parallels.com/en/122702

## Candidate implications for the payload

If the Founder selects this runtime, revise the generic manifest/build profile before materialization:

- Guest edition: Windows 11 Pro ARM64 (or Enterprise only with an applicable organizational license).
- Runtime adapter: Parallels Desktop 27.x.
- Disk representation: Parallels expanding `.hdd` inside a `.pvm` package; retain 128 GiB virtual capacity.
- Firmware and TPM: Parallels-managed UEFI, Secure Boot and vTPM 2.0. Do not inject EDK2 firmware artifacts unless a later compatibility decision explicitly requires a different runtime.
- Preserve the complete `.pvm` package, firmware state, virtual disk, configuration and receipts as one lineage-bound preservation set.

## Current host constraints

- Parallels is not installed.
- The host has 16 GiB RAM and 12 GiB available storage.
- Parallels lists at least 16 GB disk space for Windows as a minimum; the current 12 GiB free is below that minimum and does not include ISO, application, guest tools or preservation-copy headroom.
- The Windows license/product key and edition have not been confirmed.
- No installation, trial activation, purchase, download or disk creation has been performed.

## Admission boundary

Parallels Desktop 27 is a **recommended candidate**, not yet a selected or admitted runtime. Installation requires Founder approval, applicable product terms/account registration and a sufficient storage target. QEMU remains unauthorized and is not required for this candidate.
