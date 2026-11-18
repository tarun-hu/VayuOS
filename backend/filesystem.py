"""
Persistent Virtual File System Subsystem (CO4)
Simulates a 64-block disk allocation table supporting Contiguous, Linked,
and Indexed allocation strategies, permissions, and persistent JSON storage.
"""

from typing import List, Dict, Optional, Any
import os
import json
import time
import math

DISK_FILE_PATH = os.path.join(os.path.dirname(__file__), "virtual_disk.json")
TOTAL_DISK_BLOCKS = 64
BLOCK_SIZE_BYTES = 256  # 256 bytes per simulated block

FILE_COLORS = [
    "#38bdf8", "#818cf8", "#c084fc", "#f472b6",
    "#fb7185", "#fb923c", "#facc15", "#4ade80",
    "#2dd4bf", "#22d3ee", "#a78bfa", "#34d399"
]

class VirtualFileSystem:
    def __init__(self, disk_path: str = DISK_FILE_PATH):
        self.disk_path = disk_path
        self.allocation_strategy = "indexed"  # "contiguous", "linked", "indexed"
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.blocks: List[Dict[str, Any]] = []
        self._init_or_load_disk()

    def _init_or_load_disk(self):
        if os.path.exists(self.disk_path):
            try:
                with open(self.disk_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.nodes = data.get("nodes", {})
                    self.allocation_strategy = data.get("allocation_strategy", "indexed")
                    self._rebuild_disk_blocks()
                    return
            except Exception as e:
                print(f"[VFS] Error loading disk: {e}, reinitializing...")

        self._initialize_default_filesystem()
        self._save_disk()

    def _initialize_default_filesystem(self):
        self.nodes = {}
        self.allocation_strategy = "indexed"

        # Initialize Root and default directories
        now = time.strftime("%Y-%m-%d %H:%M:%S")

        self.nodes["/"] = {
            "path": "/",
            "name": "/",
            "type": "directory",
            "size": 0,
            "permissions": "rwxr-xr-x",
            "owner": "root",
            "created_at": now,
            "modified_at": now,
            "blocks": [],
            "index_block": None,
            "color": "#64748b"
        }

        default_dirs = [
            "/Applications",
            "/System",
            "/Users",
            "/Users/guest",
            "/Users/guest/Documents",
            "/Users/guest/Projects"
        ]

        for d in default_dirs:
            parts = d.strip("/").split("/")
            name = parts[-1]
            self.nodes[d] = {
                "path": d,
                "name": name,
                "type": "directory",
                "size": 0,
                "permissions": "rwxr-xr-x",
                "owner": "guest",
                "created_at": now,
                "modified_at": now,
                "blocks": [],
                "index_block": None,
                "color": "#64748b"
            }

        # Seed initial files
        welcome_text = (
            "Welcome to VayuOS macOS Desktop Environment!\n"
            "----------------------------------------------\n"
            "Kernel: Python 3.13 FastAPI Simulated OS Kernel\n"
            "GUI: React + Tailwind + Framer Motion\n"
            "Modules: CPU Scheduler, Paging, Virtual FS, Deadlock Lab\n"
            "Enjoy exploring operating systems concepts visually!"
        )

        script_py = (
            "# Sample Code Studio Python Script\n"
            "import math\n\n"
            "def calculate_primes(limit):\n"
            "    primes = []\n"
            "    for num in range(2, limit + 1):\n"
            "        if all(num % i != 0 for i in range(2, int(math.isqrt(num)) + 1)):\n"
            "            primes.append(num)\n"
            "    return primes\n\n"
            "result = calculate_primes(50)\n"
            "print('VayuOS CodeRunner executed successfully!')\n"
            "print(f'Primes up to 50: {result}')\n"
        )

        system_log = (
            "[BOOT] VayuOS Kernel v2.5 initialized.\n"
            "[INIT] Paging unit ready (128 MB RAM, 32 Frames).\n"
            "[INIT] Virtual Disk mapped (64 Blocks, 256 B/block).\n"
            "[INIT] CPU Scheduler active (RoundRobin, quantum=3).\n"
            "[OK] Desktop Environment launched.\n"
        )

        notes_txt = (
            "My Viva Notes & Checklist:\n"
            "1. Demonstrate CPU Scheduler (FCFS vs SJF vs RR)\n"
            "2. Trigger heavy load to show FIFO vs LRU page replacement\n"
            "3. Show 64-block disk allocation map (Contiguous, Linked, Indexed)\n"
            "4. Trigger Deadlock circular wait and run Auto-Recovery\n"
            "5. Run Python code from Code Studio with live RAM spike\n"
        )

        self._create_seeded_file("/Users/guest/welcome.txt", welcome_text, "#38bdf8", "indexed")
        self._create_seeded_file("/Users/guest/main.py", script_py, "#10b981", "indexed")
        self._create_seeded_file("/Users/guest/system.log", system_log, "#f59e0b", "linked")
        self._create_seeded_file("/Users/guest/notes.txt", notes_txt, "#ec4899", "contiguous")

        self._rebuild_disk_blocks()

    def _create_seeded_file(self, path: str, content: str, color: str, strategy: str):
        parts = path.strip("/").split("/")
        name = parts[-1]
        now = time.strftime("%Y-%m-%d %H:%M:%S")
        self.nodes[path] = {
            "path": path,
            "name": name,
            "type": "file",
            "size": len(content.encode("utf-8")),
            "permissions": "rw-r--r--",
            "owner": "guest",
            "created_at": now,
            "modified_at": now,
            "content": content,
            "blocks": [],
            "index_block": None,
            "allocation_strategy": strategy,
            "color": color
        }

    def _save_disk(self):
        try:
            data = {
                "allocation_strategy": self.allocation_strategy,
                "nodes": self.nodes
            }
            with open(self.disk_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[VFS] Error saving disk: {e}")

    def _rebuild_disk_blocks(self):
        """
        Reconstructs the 64 simulated blocks from currently registered files.
        """
        self.blocks = []
        for i in range(TOTAL_DISK_BLOCKS):
            self.blocks.append({
                "block_id": i,
                "is_used": False,
                "file_path": None,
                "file_name": None,
                "block_type": "free",  # "free", "data", "index"
                "next_block": None,
                "color": "#1e293b"
            })

        # Reserve Block 0 as OS Superblock / Boot sector
        self.blocks[0]["is_used"] = True
        self.blocks[0]["file_name"] = "SUPERBLOCK"
        self.blocks[0]["block_type"] = "boot"
        self.blocks[0]["color"] = "#475569"

        # Allocate blocks for all files
        allocated_index = 1
        for path, node in self.nodes.items():
            if node.get("type") != "file":
                continue

            content = node.get("content", "")
            size = max(1, len(content.encode("utf-8")))
            blocks_needed = max(1, math.ceil(size / BLOCK_SIZE_BYTES))
            strat = node.get("allocation_strategy", self.allocation_strategy)
            color = node.get("color", "#38bdf8")

            file_blocks: List[int] = []
            index_blk: Optional[int] = None

            if strat == "indexed":
                # Need 1 block for index + N blocks for data
                total_needed = blocks_needed + 1
                free_slots = [b["block_id"] for b in self.blocks if not b["is_used"]]
                if len(free_slots) >= total_needed:
                    index_blk = free_slots[0]
                    self.blocks[index_blk]["is_used"] = True
                    self.blocks[index_blk]["file_path"] = path
                    self.blocks[index_blk]["file_name"] = node["name"]
                    self.blocks[index_blk]["block_type"] = "index"
                    self.blocks[index_blk]["color"] = "#6366f1"  # Distinct purple index block

                    data_slots = free_slots[1:1 + blocks_needed]
                    for d_slot in data_slots:
                        self.blocks[d_slot]["is_used"] = True
                        self.blocks[d_slot]["file_path"] = path
                        self.blocks[d_slot]["file_name"] = node["name"]
                        self.blocks[d_slot]["block_type"] = "data"
                        self.blocks[d_slot]["color"] = color
                        file_blocks.append(d_slot)

            elif strat == "contiguous":
                # Find consecutive free blocks
                found_start = None
                for s in range(1, TOTAL_DISK_BLOCKS - blocks_needed + 1):
                    if all(not self.blocks[s + k]["is_used"] for k in range(blocks_needed)):
                        found_start = s
                        break
                if found_start is not None:
                    for k in range(blocks_needed):
                        b_id = found_start + k
                        self.blocks[b_id]["is_used"] = True
                        self.blocks[b_id]["file_path"] = path
                        self.blocks[b_id]["file_name"] = node["name"]
                        self.blocks[b_id]["block_type"] = "data"
                        self.blocks[b_id]["color"] = color
                        file_blocks.append(b_id)
                else:
                    # Fallback to any free slots if contiguous space is fragmented
                    free_slots = [b["block_id"] for b in self.blocks if not b["is_used"]][:blocks_needed]
                    for s in free_slots:
                        self.blocks[s]["is_used"] = True
                        self.blocks[s]["file_path"] = path
                        self.blocks[s]["file_name"] = node["name"]
                        self.blocks[s]["block_type"] = "data"
                        self.blocks[s]["color"] = color
                        file_blocks.append(s)

            else:  # linked
                free_slots = [b["block_id"] for b in self.blocks if not b["is_used"]][:blocks_needed]
                for idx, b_id in enumerate(free_slots):
                    next_ptr = free_slots[idx + 1] if idx + 1 < len(free_slots) else None
                    self.blocks[b_id]["is_used"] = True
                    self.blocks[b_id]["file_path"] = path
                    self.blocks[b_id]["file_name"] = node["name"]
                    self.blocks[b_id]["block_type"] = "data"
                    self.blocks[b_id]["next_block"] = next_ptr
                    self.blocks[b_id]["color"] = color
                    file_blocks.append(b_id)

            node["blocks"] = file_blocks
            node["index_block"] = index_blk

    def normalize_path(self, path: str) -> str:
        if not path.startswith("/"):
            path = "/" + path
        parts = [p for p in path.split("/") if p and p != "."]
        stack = []
        for p in parts:
            if p == "..":
                if stack:
                    stack.pop()
            else:
                stack.append(p)
        return "/" + "/".join(stack)

    def ls(self, directory: str = "/Users/guest") -> List[Dict[str, Any]]:
        norm_dir = self.normalize_path(directory)
        if norm_dir != "/" and norm_dir not in self.nodes:
            return []

        results = []
        for path, node in self.nodes.items():
            if path == norm_dir:
                continue
            parent = "/".join(path.rstrip("/").split("/")[:-1])
            if parent == "" and norm_dir == "/":
                results.append(node)
            elif parent == norm_dir:
                results.append(node)

        # Sort: directories first, then alphabetical
        return sorted(results, key=lambda x: (x["type"] != "directory", x["name"].lower()))

    def cat(self, path: str) -> Optional[str]:
        norm = self.normalize_path(path)
        if norm in self.nodes and self.nodes[norm]["type"] == "file":
            return self.nodes[norm].get("content", "")
        return None

    def mkdir(self, path: str) -> bool:
        norm = self.normalize_path(path)
        if norm in self.nodes:
            return False

        parent = "/".join(norm.rstrip("/").split("/")[:-1])
        if parent != "" and parent not in self.nodes:
            self.mkdir(parent)

        name = norm.rstrip("/").split("/")[-1]
        now = time.strftime("%Y-%m-%d %H:%M:%S")

        self.nodes[norm] = {
            "path": norm,
            "name": name,
            "type": "directory",
            "size": 0,
            "permissions": "rwxr-xr-x",
            "owner": "guest",
            "created_at": now,
            "modified_at": now,
            "blocks": [],
            "index_block": None,
            "color": "#64748b"
        }
        self._save_disk()
        return True

    def touch(self, path: str, content: str = "") -> bool:
        norm = self.normalize_path(path)
        parent = "/".join(norm.rstrip("/").split("/")[:-1])
        if parent != "" and parent not in self.nodes:
            self.mkdir(parent)

        name = norm.rstrip("/").split("/")[-1]
        now = time.strftime("%Y-%m-%d %H:%M:%S")

        color = FILE_COLORS[len(self.nodes) % len(FILE_COLORS)]

        self.nodes[norm] = {
            "path": norm,
            "name": name,
            "type": "file",
            "size": len(content.encode("utf-8")),
            "permissions": "rw-r--r--",
            "owner": "guest",
            "created_at": now,
            "modified_at": now,
            "content": content,
            "blocks": [],
            "index_block": None,
            "allocation_strategy": self.allocation_strategy,
            "color": color
        }
        self._rebuild_disk_blocks()
        self._save_disk()
        return True

    def write_file(self, path: str, content: str) -> bool:
        norm = self.normalize_path(path)
        if norm not in self.nodes:
            return self.touch(norm, content)

        if self.nodes[norm]["type"] != "file":
            return False

        now = time.strftime("%Y-%m-%d %H:%M:%S")
        self.nodes[norm]["content"] = content
        self.nodes[norm]["size"] = len(content.encode("utf-8"))
        self.nodes[norm]["modified_at"] = now
        self._rebuild_disk_blocks()
        self._save_disk()
        return True

    def rm(self, path: str) -> bool:
        norm = self.normalize_path(path)
        if norm == "/" or norm not in self.nodes:
            return False

        # If directory, recursively delete children
        to_delete = [p for p in self.nodes if p == norm or p.startswith(norm + "/")]
        for p in to_delete:
            del self.nodes[p]

        self._rebuild_disk_blocks()
        self._save_disk()
        return True

    def set_allocation_strategy(self, strategy: str):
        if strategy in ["contiguous", "linked", "indexed"]:
            self.allocation_strategy = strategy
            # Update all files to use this new visualization strategy
            for node in self.nodes.values():
                if node.get("type") == "file":
                    node["allocation_strategy"] = strategy
            self._rebuild_disk_blocks()
            self._save_disk()

    def get_state(self) -> Dict[str, Any]:
        used_blocks = sum(1 for b in self.blocks if b["is_used"])
        total_files = sum(1 for n in self.nodes.values() if n["type"] == "file")
        total_dirs = sum(1 for n in self.nodes.values() if n["type"] == "directory")

        return {
            "total_blocks": TOTAL_DISK_BLOCKS,
            "used_blocks": used_blocks,
            "free_blocks": TOTAL_DISK_BLOCKS - used_blocks,
            "block_size_bytes": BLOCK_SIZE_BYTES,
            "total_capacity_bytes": TOTAL_DISK_BLOCKS * BLOCK_SIZE_BYTES,
            "used_bytes": sum(n.get("size", 0) for n in self.nodes.values()),
            "allocation_strategy": self.allocation_strategy,
            "total_files": total_files,
            "total_directories": total_dirs,
            "blocks": self.blocks,
            "nodes": self.nodes
        }
