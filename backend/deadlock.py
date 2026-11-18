"""
Deadlock Manager Subsystem (CO2)
Implements Banker's Algorithm, Resource Allocation Graph (RAG),
Cycle Detection, Circular-Wait Deadlock Simulation, and Automatic Recovery.
"""

from typing import List, Dict, Optional, Any, Set, Tuple

DEFAULT_RESOURCES = {
    "Printer": 1,
    "GPU": 1,
    "Network Socket": 2,
    "File Lock": 1
}

class DeadlockManager:
    def __init__(self):
        self.total_resources: Dict[str, int] = dict(DEFAULT_RESOURCES)
        # allocations[process_name][resource_name] = count
        self.allocations: Dict[str, Dict[str, int]] = {}
        # requests[process_name][resource_name] = count
        self.requests: Dict[str, Dict[str, int]] = {}
        # max_claims[process_name][resource_name] = count (for Banker's Algorithm)
        self.max_claims: Dict[str, Dict[str, int]] = {}
        # Process metadata
        self.process_meta: Dict[str, Dict[str, Any]] = {}
        self.recovery_log: List[str] = []

    def register_process(self, name: str, pid: Optional[int] = None, priority: int = 3, max_demand: Optional[Dict[str, int]] = None):
        if name not in self.allocations:
            self.allocations[name] = {r: 0 for r in self.total_resources}
            self.requests[name] = {r: 0 for r in self.total_resources}
            
            # Default max claims if not specified
            default_max = {}
            for r, total in self.total_resources.items():
                default_max[r] = min(1, total)
            self.max_claims[name] = max_demand or default_max
            
            self.process_meta[name] = {
                "pid": pid or (100 + len(self.allocations)),
                "priority": priority,
                "name": name
            }

    def unregister_process(self, name: str):
        if name in self.allocations:
            del self.allocations[name]
        if name in self.requests:
            del self.requests[name]
        if name in self.max_claims:
            del self.max_claims[name]
        if name in self.process_meta:
            del self.process_meta[name]
        # Fulfill waiting requests with newly released resources
        for r in self.total_resources:
            self._fulfill_pending_requests(r)

    def get_available(self) -> Dict[str, int]:
        available = dict(self.total_resources)
        for p, alloc in self.allocations.items():
            for r, count in alloc.items():
                available[r] = max(0, available.get(r, 0) - count)
        return available

    def request_resource(self, process_name: str, resource_name: str, amount: int = 1) -> Dict[str, Any]:
        if resource_name not in self.total_resources:
            return {"success": False, "message": f"Resource {resource_name} does not exist"}

        if process_name not in self.allocations:
            self.register_process(process_name)

        avail = self.get_available()
        if avail.get(resource_name, 0) >= amount:
            # Can allocate immediately
            self.allocations[process_name][resource_name] += amount
            # Clear pending request if any
            self.requests[process_name][resource_name] = max(0, self.requests[process_name][resource_name] - amount)
            return {"success": True, "allocated": True, "message": f"Allocated {amount} {resource_name} to {process_name}"}
        else:
            # Process must wait -> request edge in RAG
            self.requests[process_name][resource_name] += amount
            return {"success": True, "allocated": False, "message": f"{process_name} waiting for {amount} {resource_name}"}

    def release_resource(self, process_name: str, resource_name: str, amount: int = 1) -> Dict[str, Any]:
        if process_name not in self.allocations or resource_name not in self.total_resources:
            return {"success": False, "message": "Invalid process or resource"}

        current_alloc = self.allocations[process_name].get(resource_name, 0)
        actual_release = min(current_alloc, amount)
        self.allocations[process_name][resource_name] -= actual_release

        # Try satisfying any pending requests for this resource
        self._fulfill_pending_requests(resource_name)

        return {"success": True, "message": f"Released {actual_release} {resource_name} from {process_name}"}

    def _fulfill_pending_requests(self, resource_name: str):
        avail = self.get_available()
        for p, reqs in self.requests.items():
            needed = reqs.get(resource_name, 0)
            if needed > 0 and avail.get(resource_name, 0) >= needed:
                self.allocations[p][resource_name] += needed
                self.requests[p][resource_name] = 0
                avail[resource_name] -= needed

    def detect_deadlock(self) -> Tuple[bool, List[str], List[Dict[str, str]]]:
        """
        RAG cycle detection algorithm using depth-first search.
        Returns (is_deadlocked, cycle_nodes, cycle_edges).
        """
        # Build adjacency graph
        # Nodes can be process: "P:name" or resource: "R:name"
        adj: Dict[str, List[str]] = {}

        # Edges:
        # Assignment edge: Resource -> Process
        for p, alloc in self.allocations.items():
            for r, count in alloc.items():
                if count > 0:
                    r_node = f"R:{r}"
                    p_node = f"P:{p}"
                    adj.setdefault(r_node, []).append(p_node)

        # Request edge: Process -> Resource
        for p, reqs in self.requests.items():
            for r, count in reqs.items():
                if count > 0:
                    p_node = f"P:{p}"
                    r_node = f"R:{r}"
                    adj.setdefault(p_node, []).append(r_node)

        visited: Set[str] = set()
        rec_stack: Set[str] = set()
        path: List[str] = []

        def dfs(node: str) -> Optional[List[str]]:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)

            for neighbor in adj.get(node, []):
                if neighbor not in visited:
                    res = dfs(neighbor)
                    if res:
                        return res
                elif neighbor in rec_stack:
                    # Cycle found!
                    cycle_start = path.index(neighbor)
                    return path[cycle_start:] + [neighbor]

            rec_stack.remove(node)
            path.pop()
            return None

        for n in list(adj.keys()):
            if n not in visited:
                cycle = dfs(n)
                if cycle:
                    # Construct cycle edges
                    cycle_edges = []
                    for i in range(len(cycle) - 1):
                        cycle_edges.append({"from": cycle[i], "to": cycle[i+1]})
                    return True, cycle, cycle_edges

        return False, [], []

    def check_bankers_safety(self) -> Dict[str, Any]:
        """
        Executes Banker's Safety Algorithm to verify if system is in safe state.
        Calculates safe execution sequence if safe.
        """
        available = dict(self.get_available())
        procs = list(self.allocations.keys())
        need = {}

        for p in procs:
            need[p] = {}
            for r in self.total_resources:
                max_val = self.max_claims.get(p, {}).get(r, 1)
                alloc_val = self.allocations.get(p, {}).get(r, 0)
                need[p][r] = max(0, max_val - alloc_val)

        work = dict(available)
        finish = {p: False for p in procs}
        safe_sequence: List[str] = []

        while len(safe_sequence) < len(procs):
            found_candidate = False
            for p in procs:
                if not finish[p]:
                    # Check if Need[p] <= Work
                    can_satisfy = all(need[p][r] <= work.get(r, 0) for r in self.total_resources)
                    if can_satisfy:
                        # Process completes, releases its allocated resources to Work
                        for r in self.total_resources:
                            work[r] += self.allocations.get(p, {}).get(r, 0)
                        finish[p] = True
                        safe_sequence.append(p)
                        found_candidate = True
                        break
            if not found_candidate:
                break

        is_safe = (len(safe_sequence) == len(procs))
        return {
            "is_safe": is_safe,
            "safe_sequence": safe_sequence,
            "work": work,
            "need": need
        }

    def trigger_deadlock_preset(self) -> Dict[str, Any]:
        """
        Creates a textbook 3-process circular wait deadlock:
        P1 holds Printer, waits for GPU.
        P2 holds GPU, waits for Network Socket.
        P3 holds Network Socket, waits for Printer.
        """
        # Clear existing
        self.allocations.clear()
        self.requests.clear()
        self.max_claims.clear()
        self.process_meta.clear()

        # Register P1, P2, P3
        self.register_process("Process-1 (RenderEngine)", pid=101, priority=2)
        self.register_process("Process-2 (DataSync)", pid=102, priority=3)
        self.register_process("Process-3 (PrintSpooler)", pid=103, priority=4)

        # Allocate locks
        self.allocations["Process-1 (RenderEngine)"]["Printer"] = 1
        self.allocations["Process-2 (DataSync)"]["GPU"] = 1
        self.allocations["Process-3 (PrintSpooler)"]["Network Socket"] = 2

        # Create conflicting requests (circular wait)
        self.requests["Process-1 (RenderEngine)"]["GPU"] = 1
        self.requests["Process-2 (DataSync)"]["Network Socket"] = 1
        self.requests["Process-3 (PrintSpooler)"]["Printer"] = 1

        is_dl, cycle, edges = self.detect_deadlock()
        self.recovery_log.append("Triggered circular wait preset: P1 -> GPU -> P2 -> Socket -> P3 -> Printer -> P1.")
        return {
            "deadlock_detected": is_dl,
            "cycle": cycle,
            "cycle_edges": edges
        }

    def auto_recover(self) -> Dict[str, Any]:
        """
        Deadlock Recovery Algorithm:
        Identifies a victim process from the cycle and terminates it,
        releasing all held resources so remaining processes can proceed.
        """
        is_dl, cycle, _ = self.detect_deadlock()
        if not is_dl:
            return {"recovered": False, "message": "System is not in a deadlock state."}

        # Extract process names from cycle
        process_victims = [node.replace("P:", "") for node in cycle if node.startswith("P:")]
        if not process_victims:
            # Fallback to any process with allocations
            process_victims = list(self.allocations.keys())

        # Select victim: lowest priority (highest priority number) or highest resource count
        victim = max(
            process_victims,
            key=lambda p: (self.process_meta.get(p, {}).get("priority", 3), sum(self.allocations.get(p, {}).values()))
        )

        released_resources = dict(self.allocations.get(victim, {}))

        # Terminate victim
        self.unregister_process(victim)

        # Fulfill waiting requests with newly released resources
        for r in self.total_resources:
            self._fulfill_pending_requests(r)

        new_is_dl, new_cycle, _ = self.detect_deadlock()
        log_msg = f"Auto-Recovered: Terminated victim '{victim}' and freed {released_resources}. Deadlock resolved: {not new_is_dl}."
        self.recovery_log.append(log_msg)

        return {
            "recovered": not new_is_dl,
            "victim_terminated": victim,
            "freed_resources": released_resources,
            "new_deadlock_status": new_is_dl,
            "message": log_msg
        }

    def reset(self):
        self.allocations.clear()
        self.requests.clear()
        self.max_claims.clear()
        self.process_meta.clear()
        self.recovery_log.clear()

    def get_state(self) -> Dict[str, Any]:
        is_dl, cycle, cycle_edges = self.detect_deadlock()
        safety = self.check_bankers_safety()

        # Build Graph Nodes & Edges for visual rendering
        nodes = []
        edges = []

        # Resource nodes
        for r_name, total_cnt in self.total_resources.items():
            avail_cnt = self.get_available().get(r_name, 0)
            nodes.append({
                "id": f"R:{r_name}",
                "label": r_name,
                "type": "resource",
                "total": total_cnt,
                "available": avail_cnt,
                "is_deadlocked": any(f"R:{r_name}" == c for c in cycle)
            })

        # Process nodes
        for p_name, meta in self.process_meta.items():
            nodes.append({
                "id": f"P:{p_name}",
                "label": p_name,
                "type": "process",
                "pid": meta.get("pid"),
                "priority": meta.get("priority"),
                "is_deadlocked": any(f"P:{p_name}" == c for c in cycle)
            })

        # Allocation edges (Resource -> Process)
        for p, alloc in self.allocations.items():
            for r, count in alloc.items():
                if count > 0:
                    is_in_cycle = any(e.get("from") == f"R:{r}" and e.get("to") == f"P:{p}" for e in cycle_edges)
                    edges.append({
                        "from": f"R:{r}",
                        "to": f"P:{p}",
                        "type": "assignment",
                        "count": count,
                        "in_cycle": is_in_cycle
                    })

        # Request edges (Process -> Resource)
        for p, reqs in self.requests.items():
            for r, count in reqs.items():
                if count > 0:
                    is_in_cycle = any(e.get("from") == f"P:{p}" and e.get("to") == f"R:{r}" for e in cycle_edges)
                    edges.append({
                        "from": f"P:{p}",
                        "to": f"R:{r}",
                        "type": "request",
                        "count": count,
                        "in_cycle": is_in_cycle
                    })

        return {
            "total_resources": self.total_resources,
            "available_resources": self.get_available(),
            "allocations": self.allocations,
            "requests": self.requests,
            "max_claims": self.max_claims,
            "is_deadlocked": is_dl,
            "cycle": cycle,
            "cycle_edges": cycle_edges,
            "bankers_safety": safety,
            "graph_nodes": nodes,
            "graph_edges": edges,
            "recovery_log": self.recovery_log[-10:]
        }
