"""
CPU Scheduler Subsystem (CO1 & CO2)
Implements Process Control Block (PCB) management, live switching between
FCFS, SJF, Priority, and Round Robin scheduling algorithms, and Gantt chart tracking.
"""

from typing import List, Dict, Optional, Any, Callable
import random

PALETTE = [
    "#38bdf8",  # sky
    "#a855f7",  # purple
    "#22c55e",  # green
    "#f59e0b",  # amber
    "#ec4899",  # pink
    "#06b6d4",  # cyan
    "#e11d48",  # rose
    "#6366f1",  # indigo
    "#10b981",  # emerald
    "#8b5cf6",  # violet
]

class Process:
    def __init__(
        self,
        pid: int,
        name: str,
        burst_time: int,
        priority: int = 3,
        ram_mb: int = 8,
        color: Optional[str] = None,
        is_system: bool = False,
        arrival_time: int = 0
    ):
        self.pid: int = pid
        self.name: str = name
        self.burst_time: int = burst_time
        self.remaining_time: int = burst_time
        self.priority: int = priority  # 1 = Highest, 5 = Lowest
        self.ram_mb: int = ram_mb
        self.state: str = "READY"  # READY, RUNNING, BLOCKED, TERMINATED
        self.arrival_time: int = arrival_time
        self.start_time: Optional[int] = None
        self.finish_time: Optional[int] = None
        self.waiting_time: int = 0
        self.turnaround_time: int = 0
        self.color: str = color or random.choice(PALETTE)
        self.is_system: bool = is_system
        self.frame_ids: List[int] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pid": self.pid,
            "name": self.name,
            "burst_time": self.burst_time,
            "remaining_time": self.remaining_time,
            "priority": self.priority,
            "ram_mb": self.ram_mb,
            "state": self.state,
            "arrival_time": self.arrival_time,
            "start_time": self.start_time,
            "finish_time": self.finish_time,
            "waiting_time": self.waiting_time,
            "turnaround_time": self.turnaround_time,
            "progress_percent": round(((self.burst_time - self.remaining_time) / max(1, self.burst_time)) * 100, 1),
            "color": self.color,
            "is_system": self.is_system,
            "frame_ids": self.frame_ids
        }


class CPUScheduler:
    def __init__(self, on_memory_deallocate: Optional[Callable[[int], None]] = None):
        self.current_tick: int = 0
        self.algorithm: str = "RoundRobin"  # "FCFS", "SJF", "Priority", "RoundRobin"
        self.time_quantum: int = 3
        self.current_quantum_used: int = 0
        self.next_pid: int = 100
        self.processes: Dict[int, Process] = {}
        self.ready_queue: List[int] = []
        self.running_pid: Optional[int] = None
        self.gantt_history: List[Dict[str, Any]] = []
        self.max_gantt_length: int = 40
        self.on_memory_deallocate = on_memory_deallocate
        self.cpu_idle_ticks: int = 0

    def set_algorithm(self, algorithm: str, time_quantum: Optional[int] = None):
        if algorithm in ["FCFS", "SJF", "Priority", "RoundRobin"]:
            self.algorithm = algorithm
        if time_quantum is not None and time_quantum > 0:
            self.time_quantum = time_quantum
        self.current_quantum_used = 0

    def create_process(
        self,
        name: str,
        burst_time: int,
        priority: int = 3,
        ram_mb: int = 8,
        color: Optional[str] = None,
        is_system: bool = False
    ) -> Process:
        pid = self.next_pid
        self.next_pid += 1

        proc = Process(
            pid=pid,
            name=name,
            burst_time=burst_time,
            priority=priority,
            ram_mb=ram_mb,
            color=color,
            is_system=is_system,
            arrival_time=self.current_tick
        )
        self.processes[pid] = proc
        self.ready_queue.append(pid)
        return proc

    def kill_process(self, pid: int) -> bool:
        if pid not in self.processes:
            return False

        proc = self.processes[pid]
        proc.state = "TERMINATED"
        proc.finish_time = self.current_tick
        proc.turnaround_time = self.current_tick - proc.arrival_time

        if pid in self.ready_queue:
            self.ready_queue.remove(pid)

        if self.running_pid == pid:
            self.running_pid = None
            self.current_quantum_used = 0

        if self.on_memory_deallocate:
            self.on_memory_deallocate(pid)

        return True

    def block_process(self, pid: int):
        if pid in self.processes:
            proc = self.processes[pid]
            proc.state = "BLOCKED"
            if pid in self.ready_queue:
                self.ready_queue.remove(pid)
            if self.running_pid == pid:
                self.running_pid = None
                self.current_quantum_used = 0

    def unblock_process(self, pid: int):
        if pid in self.processes:
            proc = self.processes[pid]
            if proc.state == "BLOCKED":
                proc.state = "READY"
                if pid not in self.ready_queue:
                    self.ready_queue.append(pid)

    def _select_next_process(self) -> Optional[int]:
        valid_ready = [pid for pid in self.ready_queue if self.processes[pid].state == "READY"]
        if not valid_ready:
            return None

        if self.algorithm == "FCFS":
            # Head of ready queue
            return valid_ready[0]

        elif self.algorithm == "SJF":
            # Shortest Remaining Time First
            return min(valid_ready, key=lambda pid: self.processes[pid].remaining_time)

        elif self.algorithm == "Priority":
            # Highest priority (lowest integer value)
            return min(valid_ready, key=lambda pid: (self.processes[pid].priority, self.processes[pid].arrival_time))

        elif self.algorithm == "RoundRobin":
            # Round Robin picks head of ready queue
            return valid_ready[0]

        return valid_ready[0]

    def step(self) -> Dict[str, Any]:
        """
        Executes one clock cycle (tick) of the CPU scheduler.
        """
        self.current_tick += 1

        # Check if currently running process has finished or needs quantum preemption
        if self.running_pid is not None:
            curr = self.processes[self.running_pid]

            if curr.remaining_time <= 0:
                # Finished
                curr.state = "TERMINATED"
                curr.finish_time = self.current_tick
                curr.turnaround_time = self.current_tick - curr.arrival_time
                if self.running_pid in self.ready_queue:
                    self.ready_queue.remove(self.running_pid)
                if self.on_memory_deallocate:
                    self.on_memory_deallocate(self.running_pid)
                self.running_pid = None
                self.current_quantum_used = 0

            elif self.algorithm == "RoundRobin" and self.current_quantum_used >= self.time_quantum:
                # Quantum expired, preempt
                curr.state = "READY"
                if self.running_pid in self.ready_queue:
                    self.ready_queue.remove(self.running_pid)
                self.ready_queue.append(self.running_pid)
                self.running_pid = None
                self.current_quantum_used = 0

            elif self.algorithm in ["SJF", "Priority"]:
                # Check for preemption if a more urgent process is now READY
                next_cand = self._select_next_process()
                if next_cand is not None and next_cand != self.running_pid:
                    curr.state = "READY"
                    self.running_pid = None

        # If no process currently running, select one
        if self.running_pid is None:
            cand = self._select_next_process()
            if cand is not None:
                self.running_pid = cand
                if cand in self.ready_queue:
                    self.ready_queue.remove(cand)
                proc = self.processes[cand]
                proc.state = "RUNNING"
                if proc.start_time is None:
                    proc.start_time = self.current_tick
                self.current_quantum_used = 0

        # Execute running process for 1 tick
        executed_process: Optional[Process] = None
        if self.running_pid is not None:
            proc = self.processes[self.running_pid]
            proc.remaining_time = max(0, proc.remaining_time - 1)
            self.current_quantum_used += 1
            executed_process = proc

            # Add to Gantt history
            self.gantt_history.append({
                "tick": self.current_tick,
                "pid": proc.pid,
                "name": proc.name,
                "color": proc.color
            })
        else:
            self.cpu_idle_ticks += 1
            self.gantt_history.append({
                "tick": self.current_tick,
                "pid": None,
                "name": "IDLE",
                "color": "#334155"
            })

        # Trim Gantt history
        if len(self.gantt_history) > self.max_gantt_length:
            self.gantt_history.pop(0)

        # Update waiting time for READY processes
        for pid in self.ready_queue:
            p = self.processes[pid]
            if p.state == "READY":
                p.waiting_time += 1

        return {
            "tick": self.current_tick,
            "running_pid": self.running_pid,
            "executed_process": executed_process.to_dict() if executed_process else None
        }

    def get_state(self) -> Dict[str, Any]:
        procs = [p.to_dict() for p in self.processes.values()]
        active_procs = [p for p in procs if p["state"] in ["RUNNING", "READY", "BLOCKED"]]
        terminated_procs = [p for p in procs if p["state"] == "TERMINATED"]

        avg_waiting = 0.0
        avg_turnaround = 0.0
        if terminated_procs:
            avg_waiting = round(sum(p["waiting_time"] for p in terminated_procs) / len(terminated_procs), 2)
            avg_turnaround = round(sum(p["turnaround_time"] for p in terminated_procs) / len(terminated_procs), 2)

        # CPU Utilization calculation over gantt window
        recent_busy = sum(1 for g in self.gantt_history if g["pid"] is not None)
        cpu_util = round((recent_busy / max(1, len(self.gantt_history))) * 100, 1) if self.gantt_history else 0.0

        return {
            "current_tick": self.current_tick,
            "algorithm": self.algorithm,
            "time_quantum": self.time_quantum,
            "current_quantum_used": self.current_quantum_used,
            "running_pid": self.running_pid,
            "ready_queue": self.ready_queue,
            "total_processes": len(self.processes),
            "active_processes_count": len(active_procs),
            "terminated_count": len(terminated_procs),
            "cpu_utilization_percent": cpu_util,
            "average_waiting_time": avg_waiting,
            "average_turnaround_time": avg_turnaround,
            "gantt_history": self.gantt_history,
            "processes": list(self.processes.values())
        }
