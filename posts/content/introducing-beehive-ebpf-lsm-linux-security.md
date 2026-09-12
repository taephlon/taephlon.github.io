# Building a Kernel-Level Security Platform with eBPF LSM and Beehive

Linux security has traditionally been divided into two separate paradigms: network firewalls (`iptables`, `nftables`) and Linux Security Modules (`SELinux`, `AppArmor`). While effective, traditional LSMs often require writing complex domain-specific policy languages, compiling out-of-tree kernel modules, or managing static configuration files that lack real-time context.

Enter **eBPF LSM** (Linux Security Module hooks backed by Extended Berkeley Packet Filter), introduced in Linux kernel 5.7. By combining the programmability of eBPF with the deep enforcement capabilities of LSM hooks, we can build custom, programmable, and dynamic kernel security policies without rebooting or risking kernel panics.

To put this into practice, I built [**Beehive** (`github.com/taephlon/beehive`)](https://github.com/taephlon/beehive) — a policy-driven, context-aware Linux security platform built from the ground up using eBPF LSM and eBPF networking.

---

## What is eBPF LSM?

Standard LSM hooks exist throughout key execution paths in the Linux kernel — verifying process execution, file access, inode modifications, socket creation, and capability checks. Historically, inserting logic into these hooks required loading a full kernel module or utilizing predefined LSM frameworks like AppArmor or SELinux.

With `BPF_PROG_TYPE_LSM`, eBPF programs can attach directly to these LSM hooks:

```
                      User Execution / System Call
                                  │
                                  ▼
                        Linux Kernel VFS / Syscall
                                  │
                                  ▼
                         LSM Security Hook
                                  │
                       ┌──────────┴──────────┐
                       ▼                     ▼
                Traditional LSM           eBPF LSM
              (AppArmor / SELinux)      (Beehive BPF)
                       │                     │
                       └──────────┬──────────┘
                                  ▼
                        Policy Decision (0 / -EPERM)
```

Key advantages of eBPF LSM include:
1. **Safety via Verifier**: The kernel BPF verifier guarantees that the attached program cannot deadlock, access arbitrary memory, or crash the kernel.
2. **Dynamic Hot-Loading**: Policies can be attached, updated, or removed atomically at runtime using BPF maps.
3. **Rich Context**: Unlike packet-only firewalls, eBPF LSM programs inspect socket owners, binary paths, process Cgroups, parent PIDs, and user namespaces simultaneously.

---

## Introducing Beehive

[**Beehive**](https://github.com/taephlon/beehive) is designed to provide process-level context, resource access control, capability restrictions, auditability, and safe policy rollout across modern Linux systems.

```
                         🐝 BEEHIVE
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
              Network       Process      Filesystem
                 │            │            │
                 └────────────┼────────────┘
                              ▼
                         eBPF / LSM
                              │
                              ▼
                        Policy Engine
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 ALLOW                 DENY
```

### 🐝 Beehive Architecture & Terminology

Beehive organizes its components around a clean modular architecture:

| Component | Description |
|---|---|
| **Hive** | Central policy & state engine running in userspace |
| **Bees** | Kernel-space eBPF programs attached to LSM and network hooks |
| **Keeper** | Userspace daemon process (`beehive daemon`) |
| **Nectar** | High-performance security event audit logs & ring buffer event streams |
| **Cells** | Individual application security profiles & declarative rules |
| **Sting** | Kernel policy enforcement engine (`-EPERM` deny actions) |

---

## How Beehive Works Under the Hood

### 1. Attaching Kernel "Bees" to LSM Hooks
Beehive uses eBPF programs attached to critical LSM hooks in the kernel:
- `bpf_lsm_file_open`: Controls filesystem read/write access based on process binary identity.
- `bpf_lsm_bprm_check_security`: Intercepts binary execution attempts before `execve` completes.
- `bpf_lsm_socket_connect`: Restricts outbound network connections by linking socket operations to parent process context.
- `bpf_lsm_capget` / `bpf_lsm_capable`: Restricts process capabilities dynamically (e.g. blocking `CAP_SYS_ADMIN` or `CAP_NET_RAW` for specific binaries).

### 2. High-Performance Telemetry with BPF Ring Buffers (Nectar)
Whenever an enforcement decision or security event occurs, kernel BPF programs stream structured event payloads back to the **Keeper** daemon using BPF ring buffers (`BPF_MAP_TYPE_RINGBUF`). This guarantees near-zero telemetry overhead and real-time visibility.

### 3. Safe Policy Rollout & Dry-Run Mode
Deploying security policies in production can be intimidating if an over-eager rule breaks a critical service. Beehive supports audit/dry-run mode per cell, logging policy violations as **Nectar** events without triggering **Sting** (`-EPERM`) denials until you are confident in the policy.

---

## Quickstart & Installation

Beehive supports multiple deployment models ranging from automated scripts to native Gentoo ebuilds.

### Prerequisites
- Linux kernel 5.7+ with `CONFIG_BPF_LSM=y` enabled
- `clang` 12+ (for BPF target compilation)
- `rustc` / `cargo` 1.70+

### Installation Options

#### Option 1: Automated Installer (Recommended)
```bash
git clone https://github.com/taephlon/beehive.git
cd beehive
./install.sh
```
This builds the release binaries, installs policy templates to `/etc/beehive/policies/`, sets up systemd (`beehive.service`) or OpenRC init scripts, and runs `beehive doctor`.

#### Option 2: Cargo Native
```bash
cargo install --path .
```

#### Option 3: Gentoo Linux Ebuild (Portage)
For Gentoo users, Beehive includes a native ebuild at `ebuilds/app-admin/beehive/beehive-0.1.0.ebuild`:
```bash
cp -r ebuilds/app-admin/beehive /var/db/repos/localrepo/app-admin/
ebuild /var/db/repos/localrepo/app-admin/beehive/beehive-0.1.0.ebuild digest
emerge app-admin/beehive
```

---

## Conclusion & Open Source

eBPF LSM opens up a new era of Linux security where kernel-level enforcement is safe, fast, and programmable. With **Beehive**, managing these eBPF LSM programs and declarative policies becomes straightforward and accessible.

Check out the project source code, contribute, or open an issue on GitHub:
👉 [**github.com/taephlon/beehive**](https://github.com/taephlon/beehive)
