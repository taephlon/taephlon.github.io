# Gentoo Linux Installation: The Human-Readable Blueprint

A streamlined, cut-to-the-chase guide for spinning up a working Gentoo CLI base environment utilizing a pre-compiled binary kernel. This document ditches the exhaustive theoretical academic tangents of the standard handbook and focuses purely on executable reality.

---

### LiveCD Interface Safety Valve
Should a step go awry outside the chroot or if you lose your bearings, hit `CTRL + ALT + F2` to spawn an alternate standalone CLI terminal. Return seamlessly to your initial operational workspace at any time via `CTRL + ALT + F1`.

---

## 1. Initial Access & Disk Topography

Establish standard network visibility. Opt for interactive configuration or spin up the SSH daemon if you prefer to orchestrate the installation remotely from another workstation. Setting a root credential is mandatory for SSH access.

```bash
# Choice A: Interactive console wizard
net-setup

# Choice B: Remote daemon spin-up
passwd root
rc-service sshd start
```

### Partitioning Layout
Run a cursory check on your storage nodes via `lsblk` before committing any destructive actions. Devices manifest as legacy SATA interfaces (`/dev/sda`) or modern NVMe controllers (`/dev/nvme0n1`). 

Initialize your partitioning tool of choice:
```bash
cfdisk /dev/nvme0n1
```
*Apply the following spatial allocation parameters:*
*   **System Boot (EFI):** `1028 MB` (Formatted to VFAT later)
*   **Swap Buffer:** `8 GB`
*   **System Root:** All remaining storage overhead

Commit changes to disk, apply the target filesystems, and initialize the swap memory space:
```bash
# Verify target nodes
lsblk

# Format filesystems
mkfs.vfat /dev/nvme0n1p1
mkswap /dev/nvme0n1p2
swapon /dev/nvme0n1p2
mkfs.ext4 /dev/nvme0n1p3
```

---

## 2. Mount Points & Stage-3 Unpacking

Anchor the fresh root directory to the LiveCD, instantiate the boot path structure, and stack the hardware partitions accordingly.

```bash
mount /dev/nvme0n1p3 /mnt/gentoo
mkdir /mnt/gentoo/boot
mount /dev/nvme0n1p1 /mnt/gentoo/boot
cd /mnt/gentoo
```

Unpack your target Stage-3 tarball directly into the mounted directory root:
```bash
tar -xvf stage-3file*
```

### System Subdirectory Bindings
Expose the real kernel runtimes and core peripheral descriptors from the LiveCD host into the isolated deployment target:

```bash
mount -t proc proc /mnt/gentoo/proc
mount --rbind /sys /mnt/gentoo/sys
mount --make-rslave /mnt/gentoo/sys
mount --rbind /dev /mnt/gentoo/dev
mount --make-rslave /mnt/gentoo/dev
mount --bind /run /mnt/gentoo/run
mount --make-slave /mnt/gentoo/run
```

Carry over working DNS resolvers to prevent out-of-box network drops, then pivot directly into the newly constructed environment:
```bash
cp --dereference /etc/resolv.conf /mnt/gentoo/etc/
chroot /mnt/gentoo /bin/bash
source /etc/profile
export PS1="(chroot) $PS1"
```

---

## 3. Base OS Configuration

Map out persistent device mount mechanics via the filesystem table. Fetch block IDs using `blkid` and append them directly to `/etc/fstab`.

```bash
blkid
```

Append clean targets directly to your layout file:
```bash
echo "UUID=your-boot-partition-uuid /boot vfat defaults 1 2" >> /etc/fstab
echo "UUID=your-root-partition-uuid / ext4 defaults 0 1" >> /etc/fstab
echo "UUID=your-swap-partition-uuid none swap sw 0 0" >> /etc/fstab
```

Enforce a reliable fallback nameserver to guard package compilation against sudden localized network drops:
```bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
```

Synchronize the remote package trees and apply global environmental updates:
```bash
emerge-webrsync
env-update && source /etc/profile
```

---

## 4. Hardware Firmware, Kernel, & Boot Management

Prior to pulling down the compiled binary kernel, integrate the central hardware firmware trees. Because these bundles hold proprietary blobs, amend the portage licensing restrictions first.

```bash
# Unshackle license parameters
nano /etc/portage/package.license

# Pull down core system drivers
emerge --ask sys-kernel/linux-firmware
```

Instruct Portage to build the system kernel while passing hooks over to `grub` and `dracut`:
```bash
nano /etc/portage/package.use/installkernel
# Append the following definition: sys-kernel/installkernel grub dracut
```

### Initial Ramdisk Customization
Explicitly feed your unique system root UUID into the `dracut` configurations to secure clean system boot processes:
```bash
mkdir /etc/dracut.conf.d
echo 'kernel_cmdline="root=UUID=your-root-partition-uuid-here"' > /etc/dracut.conf.d/00-installkernel.conf
```

Build a structured symlink layout for the primary bootloader hooks:
```bash
touch /etc/cmdline
mkdir -p /etc/cmdline.d
ln -s /etc/kernel/cmdline /etc/cmdline.d/00-installkernel.conf
```

Initiate the automated binary kernel acquisition pipeline:
```bash
emerge --ask sys-kernel/gentoo-kernel-bin
```

### Core Bootloader Integration
Compile and plant the primary GRUB binaries into the standard EFI directories:
```bash
emerge --ask sys-boot/grub
grub-install --target=x86_64-efi --efi-directory=/boot --no-nvram --removable
grub-mkconfig -o /boot/grub/grub.cfg
```

---

## 5. Finalizing & Tear-Down

Establish the authentic root account credential and integrate a network control layer to handle dynamic internet discovery upon reboot.

```bash
passwd root
emerge --ask net-misc/networkmanager
```

Vacate the chroot environment, untangle the mounted subsystems gracefully, and reboot the bare metal machine:
```bash
exit
umount -l /mnt/gentoo/dev{/shm,/pts,}
umount -R /mnt/gentoo
reboot
```

---

## 🛠️ Recovery Blueprint: Falling Back to the LiveCD

Should your system bypass the internal drive and drop right back onto the installation media, **refrain from panicking.** There is zero need to wipe the slate clean. Re-stitch the directory hierarchy back together using this precise command sequence:

```bash
# Re-mount underlying nodes (assumes /dev/sda mapping)
mount /dev/sda3 /mnt/gentoo
mount /dev/sda1 /mnt/gentoo/boot

# Re-establish running infrastructure binds
mount -t proc proc /mnt/gentoo/proc
mount --rbind /sys /mnt/gentoo/sys
mount --make-rslave /mnt/gentoo/sys
mount --rbind /dev /mnt/gentoo/dev
mount --make-rslave /mnt/gentoo/dev
mount --bind /run /mnt/gentoo/run
mount --make-slave /mnt/gentoo/run

# Return to target chroot environment
cp --dereference /etc/resolv.conf /mnt/gentoo/etc/
chroot /mnt/gentoo /bin/bash
export PS1="(chroot) $PS1"
```

From inside the active recovery chroot, enforce your specific kernel package build configurations and patch the GRUB setup:
```bash
# Stabilize binary kernel hooks
emerge --config "=sys-kernel/gentoo-kernel-bin-6.18.33_p1" 

# Refresh target bootloader configuration
grub-install --target=x86_64-efi --efi-directory=/boot --no-nvram --removable
grub-mkconfig -o /boot/grub/grub.cfg
```

Tear down the mounts cleanly as shown in Phase 5 and reboot. **Happy Tweaking.**
