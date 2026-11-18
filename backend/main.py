"""
FastAPI OS Kernel Server (main.py)
Unified Operating System Kernel integrating:
- CPU Scheduler (CO1 & CO2)
- Virtual Memory & Paging (CO2 & CO3)
- Persistent Virtual File System (CO4)
- Deadlock Manager & Banker's Algorithm (CO2)
- Safe CodeRunner Execution Subsystem (CO1, CO3, CO4)
"""

import asyncio
import io
import math
import os
import subprocess
import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scheduler import CPUScheduler
from memory import MemoryManager
from filesystem import VirtualFileSystem
from deadlock import DeadlockManager

# Initialize Core OS Subsystems
memory_manager = MemoryManager()

def on_proc_deallocate(pid: int):
    memory_manager.deallocate_process_memory(pid)

scheduler = CPUScheduler(on_memory_deallocate=on_proc_deallocate)
vfs = VirtualFileSystem()
deadlock_manager = DeadlockManager()

# Background Ticker State
auto_tick_enabled = True
tick_interval_sec = 1.0
kernel_boot_time = time.time()

async def kernel_ticker_loop():
    while True:
        if auto_tick_enabled:
            step_result = scheduler.step()
            running_pid = step_result.get("running_pid")
            if running_pid:
                memory_manager.touch_memory(running_pid, scheduler.current_tick)
        await asyncio.sleep(tick_interval_sec)

def boot_default_processes():
    """Initializes default background and desktop helper processes"""
    default_apps = [
        ("WindowServer", 40, 1, 16, "#38bdf8", True),
        ("Dock", 30, 2, 8, "#a855f7", True),
        ("Finder", 35, 2, 12, "#3b82f6", False),
        ("SysLogDaemon", 25, 4, 4, "#64748b", True),
    ]
    for name, burst, priority, ram, color, is_sys in default_apps:
        proc = scheduler.create_process(
            name=name,
            burst_time=burst,
            priority=priority,
            ram_mb=ram,
            color=color,
            is_system=is_sys
        )
        frames = memory_manager.allocate_process_memory(
            pid=proc.pid,
            app_name=proc.name,
            ram_mb=proc.ram_mb,
            color=proc.color,
            current_tick=scheduler.current_tick
        )
        proc.frame_ids = frames

boot_default_processes()

@asynccontextmanager
async def lifespan(app: FastAPI):
    ticker_task = asyncio.create_task(kernel_ticker_loop())
    yield
    ticker_task.cancel()

app = FastAPI(
    title="VayuOS Kernel API",
    description="Python FastAPI Real Simulated macOS Desktop OS Kernel",
    version="2.5.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class ProcessRunRequest(BaseModel):
    name: str
    burst_time: int = 15
    priority: int = 3
    ram_mb: int = 8
    color: Optional[str] = None

class AlgorithmRequest(BaseModel):
    algorithm: str
    time_quantum: Optional[int] = 3

class TickerConfigRequest(BaseModel):
    enabled: bool
    interval_sec: Optional[float] = 1.0

class MemoryPolicyRequest(BaseModel):
    policy: str  # "FIFO" or "LRU"

class FileWriteRequest(BaseModel):
    path: str
    content: str

class FileMkdirRequest(BaseModel):
    path: str

class FileTouchRequest(BaseModel):
    path: str
    content: Optional[str] = ""

class FileRmRequest(BaseModel):
    path: str

class FileStrategyRequest(BaseModel):
    strategy: str  # "contiguous", "linked", "indexed"

class TerminalCommandRequest(BaseModel):
    command: str

class DeadlockRequestResource(BaseModel):
    process_name: str
    resource_name: str
    amount: int = 1

class DeadlockReleaseResource(BaseModel):
    process_name: str
    resource_name: str
    amount: int = 1

class DeadlockTerminateRequest(BaseModel):
    process_name: str

class PresetRequest(BaseModel):
    preset_name: str  # "heavy_load", "deadlock_scenario", "clean_boot"

class CodeExecutionRequest(BaseModel):
    code: str
    filename: Optional[str] = "script.py"


# ---------------- API ENDPOINTS ----------------

@app.get("/api/state")
def get_full_state():
    """Aggregated state of the whole OS Kernel"""
    cpu_state = scheduler.get_state()
    # Serialize processes
    cpu_state["processes"] = [p.to_dict() for p in scheduler.processes.values()]
    mem_state = memory_manager.get_state()
    fs_state = vfs.get_state()
    dl_state = deadlock_manager.get_state()

    uptime_sec = round(time.time() - kernel_boot_time, 1)

    return {
        "status": "online",
        "kernel_version": "VayuOS 2.5 (macOS Sonoma Simulation)",
        "uptime_sec": uptime_sec,
        "auto_tick_enabled": auto_tick_enabled,
        "tick_interval_sec": tick_interval_sec,
        "cpu": cpu_state,
        "memory": mem_state,
        "filesystem": fs_state,
        "deadlock": dl_state
    }

@app.post("/api/cpu/step")
def step_cpu():
    """Manually triggers 1 CPU clock cycle"""
    res = scheduler.step()
    running_pid = res.get("running_pid")
    if running_pid:
        memory_manager.touch_memory(running_pid, scheduler.current_tick)
    return {
        "success": True,
        "step_result": res,
        "current_tick": scheduler.current_tick
    }

@app.post("/api/cpu/algorithm")
def set_scheduler_algorithm(req: AlgorithmRequest):
    """Switches CPU scheduling algorithm (FCFS, SJF, Priority, RoundRobin)"""
    scheduler.set_algorithm(req.algorithm, req.time_quantum)
    return {
        "success": True,
        "algorithm": scheduler.algorithm,
        "time_quantum": scheduler.time_quantum
    }

@app.post("/api/cpu/auto-tick")
def configure_ticker(req: TickerConfigRequest):
    global auto_tick_enabled, tick_interval_sec
    auto_tick_enabled = req.enabled
    if req.interval_sec and req.interval_sec > 0:
        tick_interval_sec = req.interval_sec
    return {
        "success": True,
        "auto_tick_enabled": auto_tick_enabled,
        "tick_interval_sec": tick_interval_sec
    }

@app.post("/api/process/run")
def run_process(req: ProcessRunRequest):
    """Spawns a new process in CPU Scheduler and allocates RAM in Memory Manager"""
    proc = scheduler.create_process(
        name=req.name,
        burst_time=max(1, req.burst_time),
        priority=req.priority,
        ram_mb=max(4, req.ram_mb),
        color=req.color
    )
    frames = memory_manager.allocate_process_memory(
        pid=proc.pid,
        app_name=proc.name,
        ram_mb=proc.ram_mb,
        color=proc.color,
        current_tick=scheduler.current_tick
    )
    proc.frame_ids = frames

    return {
        "success": True,
        "process": proc.to_dict(),
        "allocated_frames": frames
    }

@app.post("/api/process/kill/{pid}")
def kill_process(pid: int):
    """Terminates process, frees its memory frames and locks"""
    if pid not in scheduler.processes:
        raise HTTPException(status_code=404, detail=f"PID {pid} not found")

    proc = scheduler.processes[pid]
    proc_name = proc.name
    success = scheduler.kill_process(pid)

    # Release any held deadlock resources
    deadlock_manager.unregister_process(proc_name)

    return {
        "success": success,
        "pid": pid,
        "message": f"Process {proc_name} (PID {pid}) terminated."
    }

@app.post("/api/memory/replace")
def set_memory_policy(req: MemoryPolicyRequest):
    """Changes page replacement algorithm between FIFO and LRU"""
    if req.policy not in ["FIFO", "LRU"]:
        raise HTTPException(status_code=400, detail="Invalid policy. Must be FIFO or LRU.")
    memory_manager.set_policy(req.policy)
    return {
        "success": True,
        "replacement_policy": memory_manager.replacement_policy
    }

@app.get("/api/files/tree")
def get_files_tree():
    return vfs.get_state()

@app.get("/api/files/ls")
def list_files(dir: str = "/Users/guest"):
    return {"path": dir, "files": vfs.ls(dir)}

@app.get("/api/files/cat")
def read_file_content(path: str):
    content = vfs.cat(path)
    if content is None:
        raise HTTPException(status_code=404, detail="File not found")
    return {"path": path, "content": content}

@app.post("/api/files/write")
def write_file_endpoint(req: FileWriteRequest):
    success = vfs.write_file(req.path, req.content)
    return {"success": success, "path": req.path}

@app.post("/api/files/mkdir")
def mkdir_endpoint(req: FileMkdirRequest):
    success = vfs.mkdir(req.path)
    return {"success": success, "path": req.path}

@app.post("/api/files/touch")
def touch_endpoint(req: FileTouchRequest):
    success = vfs.touch(req.path, req.content or "")
    return {"success": success, "path": req.path}

@app.post("/api/files/rm")
def rm_endpoint(req: FileRmRequest):
    success = vfs.rm(req.path)
    return {"success": success, "path": req.path}

@app.post("/api/files/strategy")
def set_allocation_strategy(req: FileStrategyRequest):
    vfs.set_allocation_strategy(req.strategy)
    return {
        "success": True,
        "allocation_strategy": vfs.allocation_strategy,
        "blocks": vfs.blocks
    }

@app.post("/api/files/command")
def terminal_command(req: TerminalCommandRequest):
    """
    Executes terminal commands: help, ps, run, kill, mem, ls, mkdir, touch, cat, rm, deadlock, banker, clear
    """
    raw = req.command.strip()
    if not raw:
        return {"output": ""}

    parts = raw.split()
    cmd = parts[0].lower()
    args = parts[1:]

    output = ""

    if cmd == "help":
        output = (
            "Available Terminal Commands:\n"
            "  help                           Show this menu\n"
            "  ps                             List all processes & PCB states\n"
            "  run <name> <burst> [ram]       Spawn process (e.g. run TaskA 20 8)\n"
            "  kill <pid>                     Terminate process & free frames\n"
            "  mem                            Inspect 128 MB RAM & Page Fault stats\n"
            "  ls [dir]                       List files in virtual directory\n"
            "  cat <file>                     Display file contents\n"
            "  touch <file>                   Create an empty file on disk\n"
            "  mkdir <dir>                    Create a directory\n"
            "  rm <path>                      Delete file or folder\n"
            "  algo <FCFS|SJF|Priority|RR>    Switch CPU scheduling algorithm\n"
            "  quantum <val>                  Set Round Robin time quantum\n"
            "  deadlock                       Check Resource Allocation Graph cycles\n"
            "  banker                         Run Banker's Safety Algorithm\n"
            "  clear                          Clear terminal screen\n"
        )
    elif cmd == "ps":
        procs = scheduler.processes.values()
        output = f"{'PID':<6} {'NAME':<16} {'STATE':<12} {'BURST':<8} {'REM':<8} {'PRI':<6} {'RAM':<8}\n"
        output += "-" * 64 + "\n"
        for p in procs:
            output += f"{p.pid:<6} {p.name:<16} {p.state:<12} {p.burst_time:<8} {p.remaining_time:<8} {p.priority:<6} {p.ram_mb}MB\n"

    elif cmd == "run":
        if len(args) < 2:
            output = "Usage: run <name> <burst_ticks> [ram_mb] [priority]"
        else:
            name = args[0]
            burst = int(args[1])
            ram = int(args[2]) if len(args) > 2 else 8
            pri = int(args[3]) if len(args) > 3 else 3
            proc = scheduler.create_process(name=name, burst_time=burst, priority=pri, ram_mb=ram)
            frames = memory_manager.allocate_process_memory(proc.pid, proc.name, proc.ram_mb, proc.color, scheduler.current_tick)
            proc.frame_ids = frames
            output = f"Spawned process '{name}' (PID: {proc.pid}, Burst: {burst}, RAM: {ram}MB, Allocated Frames: {frames})"

    elif cmd == "kill":
        if not args:
            output = "Usage: kill <pid>"
        else:
            try:
                pid = int(args[0])
                if scheduler.kill_process(pid):
                    output = f"Process {pid} terminated and memory deallocated."
                else:
                    output = f"PID {pid} not found."
            except ValueError:
                output = "Invalid PID."

    elif cmd == "mem":
        mem = memory_manager.get_state()
        output = (
            f"Total RAM: {mem['total_ram_mb']} MB (32 Frames x 4 MB)\n"
            f"Used: {mem['used_ram_mb']} MB ({mem['used_frames']}/32 frames, {mem['usage_percent']}%)\n"
            f"Free: {mem['free_ram_mb']} MB ({mem['free_frames']}/32 frames)\n"
            f"Replacement Policy: {mem['replacement_policy']}\n"
            f"Page Faults: {mem['page_faults']} | Page Hits: {mem['page_hits']} | Fault Rate: {mem['fault_rate_percent']}%\n"
        )

    elif cmd == "ls":
        target = args[0] if args else "/Users/guest"
        files = vfs.ls(target)
        output = f"Listing {target}:\n"
        for f in files:
            icon = "📁" if f["type"] == "directory" else "📄"
            output += f"  {icon} {f['permissions']}  {f['size']:>6}B  {f['name']}\n"

    elif cmd == "cat":
        if not args:
            output = "Usage: cat <filepath>"
        else:
            target = args[0]
            if not target.startswith("/"):
                target = "/Users/guest/" + target
            content = vfs.cat(target)
            output = content if content is not None else f"File not found: {target}"

    elif cmd == "touch":
        if not args:
            output = "Usage: touch <filename>"
        else:
            target = args[0]
            if not target.startswith("/"):
                target = "/Users/guest/" + target
            vfs.touch(target)
            output = f"Created file {target}"

    elif cmd == "mkdir":
        if not args:
            output = "Usage: mkdir <dirname>"
        else:
            target = args[0]
            if not target.startswith("/"):
                target = "/Users/guest/" + target
            vfs.mkdir(target)
            output = f"Created directory {target}"

    elif cmd == "rm":
        if not args:
            output = "Usage: rm <path>"
        else:
            target = args[0]
            if not target.startswith("/"):
                target = "/Users/guest/" + target
            vfs.rm(target)
            output = f"Removed {target}"

    elif cmd == "algo":
        if not args:
            output = f"Current algorithm: {scheduler.algorithm}"
        else:
            algo = args[0]
            if algo.lower() in ["rr", "roundrobin"]:
                scheduler.set_algorithm("RoundRobin")
            elif algo.lower() in ["fcfs"]:
                scheduler.set_algorithm("FCFS")
            elif algo.lower() in ["sjf"]:
                scheduler.set_algorithm("SJF")
            elif algo.lower() in ["priority"]:
                scheduler.set_algorithm("Priority")
            output = f"Scheduler algorithm switched to {scheduler.algorithm}"

    elif cmd == "quantum":
        if not args:
            output = f"Current quantum: {scheduler.time_quantum}"
        else:
            q = int(args[0])
            scheduler.set_algorithm(scheduler.algorithm, time_quantum=q)
            output = f"Round Robin quantum set to {q}"

    elif cmd == "deadlock":
        is_dl, cycle, _ = deadlock_manager.detect_deadlock()
        if is_dl:
            output = f"⚠️ DEADLOCK DETECTED!\nCycle: {' -> '.join(cycle)}"
        else:
            output = "✅ No deadlock detected. Resource Allocation Graph is acyclic."

    elif cmd == "banker":
        safety = deadlock_manager.check_bankers_safety()
        if safety["is_safe"]:
            output = f"✅ SAFE STATE.\nSafe Execution Sequence: {' -> '.join(safety['safe_sequence'])}"
        else:
            output = "⚠️ UNSAFE STATE! Potential deadlock condition."

    elif cmd == "whoami":
        output = "guest (uid=501, gid=20 staff)"

    elif cmd == "uname":
        output = "VayuOS Darwin Kernel Version 2.5.2: simulated macOS Sequoia x86_64"

    elif cmd == "date":
        output = time.strftime("%a %b %d %H:%M:%S %Z %Y")

    elif cmd == "echo":
        output = " ".join(args)

    elif cmd == "uptime":
        up_s = round(time.time() - kernel_boot_time, 1)
        output = f"up {up_s} seconds, current tick: #{scheduler.current_tick}, active procs: {len(scheduler.processes)}"

    elif cmd == "df":
        used = sum(1 for b in vfs.blocks if b["is_used"])
        output = (
            f"Filesystem    512-blocks      Used Available Capacity  Mounted on\n"
            f"/dev/disk0s1          64        {used:<4}        {64 - used:<4}      {round(used/64*100):<3}%  /\n"
        )

    elif cmd == "free":
        mem = memory_manager.get_state()
        output = (
            f"               total        used        free      shared  buff/cache   available\n"
            f"Mem:          128 MB       {mem['used_ram_mb']:>3} MB       {mem['free_ram_mb']:>3} MB        0 MB        0 MB       {mem['free_ram_mb']:>3} MB\n"
            f"Frames:           32          {mem['used_frames']:>2}          {mem['free_frames']:>2}\n"
        )

    elif cmd == "reboot":
        scheduler.processes.clear()
        scheduler.ready_queue.clear()
        scheduler.running_pid = None
        scheduler.gantt_history.clear()
        scheduler.current_tick = 0
        memory_manager.frames = [memory_manager.frames[0].__class__(i) for i in range(32)]
        memory_manager.reset_stats()
        deadlock_manager.reset()
        boot_default_processes()
        output = "[VayuOS Kernel Rebooted] System restored to clean boot state."

    elif cmd == "clear":
        output = "__CLEAR__"

    else:
        output = f"zsh: command not found: {cmd}. Type 'help' for available commands."

    return {"output": output}

@app.get("/api/deadlock/state")
def get_deadlock_state():
    return deadlock_manager.get_state()

@app.post("/api/deadlock/request")
def deadlock_request(req: DeadlockRequestResource):
    res = deadlock_manager.request_resource(req.process_name, req.resource_name, req.amount)
    return res

@app.post("/api/deadlock/release")
def deadlock_release(req: DeadlockReleaseResource):
    res = deadlock_manager.release_resource(req.process_name, req.resource_name, req.amount)
    return res

@app.post("/api/deadlock/terminate")
def deadlock_terminate_process(req: DeadlockTerminateRequest):
    deadlock_manager.unregister_process(req.process_name)
    # Also terminate in scheduler if exists
    for pid, p in list(scheduler.processes.items()):
        if p.name == req.process_name:
            scheduler.kill_process(pid)
    is_dl, cycle, _ = deadlock_manager.detect_deadlock()
    return {
        "success": True,
        "terminated": req.process_name,
        "is_deadlocked": is_dl,
        "cycle": cycle
    }

@app.post("/api/deadlock/trigger-deadlock")
def trigger_deadlock_endpoint():
    res = deadlock_manager.trigger_deadlock_preset()
    return res

@app.post("/api/deadlock/auto-recover")
def auto_recover_deadlock():
    res = deadlock_manager.auto_recover()
    return res

@app.post("/api/demo/preset")
def apply_preset(req: PresetRequest):
    """
    Applies 1-Click Viva Demo presets:
    - heavy_load: Spawns batch of processes exceeding 128 MB RAM to trigger page faults & LRU/FIFO replacements
    - deadlock_scenario: Triggers circular wait deadlock
    - clean_boot: Resets kernel, memory, files, scheduler to pristine state
    """
    preset = req.preset_name.lower()

    if preset == "heavy_load":
        # Spawn 8 heavy tasks to consume RAM and show FIFO/LRU swaps
        tasks = [
            ("VideoRenderer", 25, 2, 28, "#f43f5e"),
            ("MLModelInference", 30, 1, 32, "#8b5cf6"),
            ("DatabaseQuery", 18, 3, 24, "#06b6d4"),
            ("3DShaderCompiler", 22, 2, 20, "#10b981"),
            ("ChromeTabCluster", 15, 4, 32, "#f59e0b"),
        ]
        spawned = []
        for name, burst, pri, ram, color in tasks:
            proc = scheduler.create_process(name=name, burst_time=burst, priority=pri, ram_mb=ram, color=color)
            frames = memory_manager.allocate_process_memory(proc.pid, proc.name, proc.ram_mb, proc.color, scheduler.current_tick)
            proc.frame_ids = frames
            spawned.append(proc.to_dict())

        return {
            "success": True,
            "preset": "heavy_load",
            "message": f"Spawned 5 heavy workloads ({sum(t[3] for t in tasks)} MB total requested RAM). Page replacement triggered!",
            "spawned_processes": spawned
        }

    elif preset == "deadlock_scenario":
        res = deadlock_manager.trigger_deadlock_preset()
        return {
            "success": True,
            "preset": "deadlock_scenario",
            "message": "Textbook circular wait deadlock triggered in Resource Allocation Graph.",
            "details": res
        }

    elif preset == "clean_boot":
        # Reset Scheduler
        scheduler.processes.clear()
        scheduler.ready_queue.clear()
        scheduler.running_pid = None
        scheduler.gantt_history.clear()
        scheduler.current_tick = 0
        scheduler.next_pid = 100

        # Reset Memory
        memory_manager.frames = [memory_manager.frames[0].__class__(i) for i in range(32)]
        memory_manager.reset_stats()

        # Reset Deadlock
        deadlock_manager.reset()

        # Re-boot default system apps
        boot_default_processes()

        return {
            "success": True,
            "preset": "clean_boot",
            "message": "Kernel reset to clean boot state."
        }

    else:
        raise HTTPException(status_code=400, detail="Unknown preset name")

import tempfile
import uuid

@app.post("/api/process/clear-terminated")
def clear_terminated_processes():
    """Removes all terminated processes from PCB list"""
    terminated_pids = [pid for pid, p in scheduler.processes.items() if p.state == "TERMINATED"]
    for pid in terminated_pids:
        del scheduler.processes[pid]
    return {
        "success": True,
        "cleared_count": len(terminated_pids),
        "cleared_pids": terminated_pids
    }

@app.post("/api/memory/flush")
def flush_unreferenced_memory():
    """Frees frames that belong to terminated or nonexistent processes"""
    freed_count = 0
    for frame in memory_manager.frames:
        if frame.is_allocated:
            if frame.pid not in scheduler.processes or scheduler.processes[frame.pid].state == "TERMINATED":
                frame.is_allocated = False
                frame.pid = None
                frame.app_name = None
                frame.page_num = None
                frame.allocated_at_tick = 0
                frame.last_accessed_tick = 0
                frame.color = "#475569"
                freed_count += 1
    return {
        "success": True,
        "freed_frames": freed_count
    }

@app.get("/api/system/info")
def get_system_info():
    """Returns detailed OS Kernel information for viva"""
    return {
        "os_name": "VayuOS",
        "os_version": "2.5.2 (Sequoia Aesthetic)",
        "kernel": "Simulated Preemptive Microkernel (Python 3.13 FastAPI)",
        "scheduler_algorithms": ["FCFS", "SJF (SRTF)", "Priority (Preemptive)", "Round Robin"],
        "memory_model": "Paging (128 MB RAM, 32 Frames x 4 MB, FIFO & LRU)",
        "filesystem_model": "Virtual Inode Disk (64 Blocks x 256 B, Contiguous, Linked, Indexed)",
        "deadlock_model": "RAG Graph DFS Cycle Detection + Banker's Safety Algorithm",
        "python_runtime": sys.version,
        "platform": sys.platform,
        "boot_time": time.ctime(kernel_boot_time)
    }

@app.post("/api/code/execute")
async def execute_code(req: CodeExecutionRequest):
    """
    CO1, CO3, CO4:
    Executes ANY Python code snippet with full standard library support:
    1. Writes code cleanly to a temporary script file to avoid Windows command-line quoting issues.
    2. Spawns temporary compiler/interpreter process ('CodeRunner') in CPU Scheduler with 16 MB RAM.
    3. Safely executes code with a 5.0-second timeout, captured stdout/stderr, and DEVNULL stdin.
    4. Deallocates memory and returns execution metrics and stdout.
    """
    # 1. Spawn CodeRunner in CPU Scheduler
    runner_proc = scheduler.create_process(
        name="CodeRunner",
        burst_time=6,
        priority=1,
        ram_mb=16,
        color="#10b981"
    )
    frames = memory_manager.allocate_process_memory(
        pid=runner_proc.pid,
        app_name=runner_proc.name,
        ram_mb=runner_proc.ram_mb,
        color=runner_proc.color,
        current_tick=scheduler.current_tick
    )
    runner_proc.frame_ids = frames

    start_exec = time.time()
    stdout_text = ""
    stderr_text = ""
    exit_code = 0

    # Write code to a clean temporary python file
    temp_dir = tempfile.gettempdir()
    temp_filename = f"vayuos_exec_{uuid.uuid4().hex[:8]}.py"
    temp_filepath = os.path.join(temp_dir, temp_filename)

    try:
        with open(temp_filepath, "w", encoding="utf-8") as tf:
            tf.write(req.code)

        # Run python file safely with 5.0s timeout and non-blocking stdin
        proc_exec = subprocess.run(
            [sys.executable, temp_filepath],
            capture_output=True,
            text=True,
            stdin=subprocess.DEVNULL,
            timeout=5.0,
            encoding="utf-8",
            errors="replace"
        )
        stdout_text = proc_exec.stdout
        stderr_text = proc_exec.stderr
        exit_code = proc_exec.returncode
    except subprocess.TimeoutExpired:
        stderr_text = "Execution Error: Process exceeded 5.0s CPU time limit (SIGKILL sent by OS Kernel)."
        exit_code = 124
    except Exception as e:
        stderr_text = f"Execution Exception: {str(e)}"
        exit_code = 1
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass

    # Keep the process visible in scheduler and memory for 1.2s so user sees live spike
    await asyncio.sleep(1.2)

    # Clean up process from scheduler and memory
    scheduler.kill_process(runner_proc.pid)

    exec_duration_ms = round((time.time() - start_exec) * 1000, 2)

    return {
        "success": (exit_code == 0),
        "exit_code": exit_code,
        "stdout": stdout_text,
        "stderr": stderr_text,
        "duration_ms": exec_duration_ms,
        "runner_pid": runner_proc.pid,
        "ram_allocated_mb": 16,
        "frames_used": frames
    }

# Production Static Mounting (Serves React Desktop if built)
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
