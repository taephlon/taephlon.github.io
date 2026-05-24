## Introduction

Debugging the Linux kernel can feel like spelunking in a cavern with no map. This guide walks you through the essential tools you need to understand what's happening deep inside the OS.

## printk: Your First Friend

Before jumping to advanced tools, `printk()` is your baseline. It's the kernel equivalent of `printf` and gives you raw visibility into execution flow.

```c
printk(KERN_DEBUG "value: %d\n", val);
```

## KGDB: Full Kernel Debugger

KGDB lets you attach GDB to a live kernel over serial or network. Set it up with a second machine (or a VM) and you gain full breakpoint and watchpoint support.

Configure your kernel with `CONFIG_KGDB=y`, then boot with `kgdboc=ttyS0,115200 kgdbwait`.

## ftrace and perf

For performance issues and tracing call paths, `ftrace` and `perf` are indispensable. They let you trace function calls, record events, and generate flame graphs with almost no overhead.

## Conclusion

Kernel debugging is a skill you build over time. Start with printk, graduate to KGDB, and learn ftrace when you need systemic insight. Happy debugging.
