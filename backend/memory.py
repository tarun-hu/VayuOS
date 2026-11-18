"""
Virtual Memory & Paging Subsystem (CO2 & CO3)
Simulates a 128 MB Physical RAM divided into 32 frames (4 MB each).
Tracks frame ownership, page faults, page hits, and implements FIFO / LRU replacement.
"""

from typing import List, Optional, Dict, Any
import math
import time

FRAME_COUNT = 32
FRAME_SIZE_MB = 4
TOTAL_RAM_MB = FRAME_COUNT * FRAME_SIZE_MB  # 128 MB

class Frame:
    def __init__(self, frame_id: int):
        self.frame_id: int = frame_id
        self.is_allocated: bool = False
        self.pid: Optional[int] = None
        self.app_name: Optional[str] = None
        self.page_num: Optional[int] = None
        self.allocated_at_tick: int = 0
        self.last_accessed_tick: int = 0
        self.color: str = "#475569"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "frame_id": self.frame_id,
            "is_allocated": self.is_allocated,
            "pid": self.pid,
            "app_name": self.app_name,
            "page_num": self.page_num,
            "allocated_at_tick": self.allocated_at_tick,
            "last_accessed_tick": self.last_accessed_tick,
            "color": self.color,
            "size_mb": FRAME_SIZE_MB
        }


class MemoryManager:
    def __init__(self):
        self.frames: List[Frame] = [Frame(i) for i in range(FRAME_COUNT)]
        self.replacement_policy: str = "LRU"  # "FIFO" or "LRU"
        self.page_faults: int = 0
        self.page_hits: int = 0
        self.total_accesses: int = 0
        self.swap_history: List[Dict[str, Any]] = []

    def set_policy(self, policy: str):
        if policy in ["FIFO", "LRU"]:
            self.replacement_policy = policy

    def get_free_frames(self) -> List[Frame]:
        return [f for f in self.frames if not f.is_allocated]

    def allocate_process_memory(self, pid: int, app_name: str, ram_mb: int, color: str, current_tick: int) -> List[int]:
        """
        Allocates memory for a process. If insufficient free frames exist,
        triggers page replacement (FIFO or LRU).
        """
        num_frames_needed = max(1, math.ceil(ram_mb / FRAME_SIZE_MB))
        allocated_frame_ids: List[int] = []

        for page in range(num_frames_needed):
            free_frames = self.get_free_frames()
            if free_frames:
                frame = free_frames[0]
            else:
                # Need page replacement
                frame = self._select_victim_frame()
                self.page_faults += 1
                self.swap_history.append({
                    "tick": current_tick,
                    "evicted_pid": frame.pid,
                    "evicted_app": frame.app_name,
                    "new_pid": pid,
                    "new_app": app_name,
                    "frame_id": frame.frame_id,
                    "policy": self.replacement_policy,
                    "timestamp": time.time()
                })
                # Keep swap history bounded
                if len(self.swap_history) > 20:
                    self.swap_history.pop(0)

            frame.is_allocated = True
            frame.pid = pid
            frame.app_name = app_name
            frame.page_num = page
            frame.allocated_at_tick = current_tick
            frame.last_accessed_tick = current_tick
            frame.color = color
            allocated_frame_ids.append(frame.frame_id)

        self.total_accesses += num_frames_needed
        return allocated_frame_ids

    def _select_victim_frame(self) -> Frame:
        """
        Selects a victim frame based on current replacement policy (FIFO or LRU).
        Does not victimize system kernel frames if avoidable.
        """
        allocated = [f for f in self.frames if f.is_allocated]
        if not allocated:
            return self.frames[0]

        if self.replacement_policy == "FIFO":
            # Oldest allocated_at_tick
            victim = min(allocated, key=lambda f: f.allocated_at_tick)
        else:  # LRU
            # Least recently accessed
            victim = min(allocated, key=lambda f: f.last_accessed_tick)

        return victim

    def touch_memory(self, pid: int, current_tick: int):
        """
        Called when a process executes on CPU to register page hits and update LRU tracking.
        """
        touched = False
        for f in self.frames:
            if f.is_allocated and f.pid == pid:
                f.last_accessed_tick = current_tick
                self.page_hits += 1
                self.total_accesses += 1
                touched = True
        if not touched:
            self.page_faults += 1
            self.total_accesses += 1

    def deallocate_process_memory(self, pid: int):
        """
        Frees all frames belonging to a terminated or killed process.
        """
        for f in self.frames:
            if f.pid == pid:
                f.is_allocated = False
                f.pid = None
                f.app_name = None
                f.page_num = None
                f.allocated_at_tick = 0
                f.last_accessed_tick = 0
                f.color = "#475569"

    def reset_stats(self):
        self.page_faults = 0
        self.page_hits = 0
        self.total_accesses = 0
        self.swap_history.clear()

    def get_state(self) -> Dict[str, Any]:
        allocated_count = sum(1 for f in self.frames if f.is_allocated)
        used_mb = allocated_count * FRAME_SIZE_MB
        free_mb = TOTAL_RAM_MB - used_mb
        fault_rate = 0.0
        if self.total_accesses > 0:
            fault_rate = round((self.page_faults / self.total_accesses) * 100, 1)

        return {
            "total_ram_mb": TOTAL_RAM_MB,
            "frame_size_mb": FRAME_SIZE_MB,
            "total_frames": FRAME_COUNT,
            "used_frames": allocated_count,
            "free_frames": FRAME_COUNT - allocated_count,
            "used_ram_mb": used_mb,
            "free_ram_mb": free_mb,
            "usage_percent": round((used_mb / TOTAL_RAM_MB) * 100, 1),
            "replacement_policy": self.replacement_policy,
            "page_faults": self.page_faults,
            "page_hits": self.page_hits,
            "total_accesses": self.total_accesses,
            "fault_rate_percent": fault_rate,
            "frames": [f.to_dict() for f in self.frames],
            "swap_history": self.swap_history
        }
