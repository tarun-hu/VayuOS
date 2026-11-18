import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Play,
  Pause,
  SkipForward,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRightLeft,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { kernelApi } from '../../api/kernelApi';

export default function ActivityMonitor({ kernelState, onRefresh }) {
  const [activeTab, setActiveTab] = useState('cpu'); // 'cpu' or 'memory'
  const [selectedAlgo, setSelectedAlgo] = useState(kernelState?.cpu?.algorithm || 'RoundRobin');
  const [quantum, setQuantum] = useState(kernelState?.cpu?.time_quantum || 3);
  const [autoTick, setAutoTick] = useState(kernelState?.auto_tick_enabled ?? true);
  const [tickSpeed, setTickSpeed] = useState(kernelState?.tick_interval_sec ?? 1.0);
  const [memoryPolicy, setMemoryPolicy] = useState(kernelState?.memory?.replacement_policy || 'LRU');

  // New process modal
  const [showNewProcModal, setShowNewProcModal] = useState(false);
  const [newProcName, setNewProcName] = useState('WorkerTask');
  const [newProcBurst, setNewProcBurst] = useState(15);
  const [newProcPriority, setNewProcPriority] = useState(3);
  const [newProcRam, setNewProcRam] = useState(12);

  // Selected frame inspection
  const [selectedFrame, setSelectedFrame] = useState(null);

  // Synchronize state with kernelState updates from polling / presets / CLI
  useEffect(() => {
    if (kernelState?.cpu?.algorithm) {
      setSelectedAlgo(kernelState.cpu.algorithm);
    }
    if (kernelState?.cpu?.time_quantum !== undefined) {
      setQuantum(kernelState.cpu.time_quantum);
    }
    if (kernelState?.auto_tick_enabled !== undefined) {
      setAutoTick(kernelState.auto_tick_enabled);
    }
    if (kernelState?.tick_interval_sec !== undefined) {
      setTickSpeed(kernelState.tick_interval_sec);
    }
    if (kernelState?.memory?.replacement_policy) {
      setMemoryPolicy(kernelState.memory.replacement_policy);
    }
  }, [kernelState]);

  const cpu = kernelState?.cpu || {};
  const memory = kernelState?.memory || {};
  const processes = cpu.processes || [];
  const gantt = cpu.gantt_history || [];
  const frames = memory.frames || [];

  const handleAlgoChange = async (algo) => {
    setSelectedAlgo(algo);
    try {
      await kernelApi.setAlgorithm(algo, Number(quantum));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuantumChange = async (val) => {
    setQuantum(val);
    try {
      await kernelApi.setAlgorithm(selectedAlgo, Number(val));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAutoTick = async () => {
    const next = !autoTick;
    setAutoTick(next);
    try {
      await kernelApi.setAutoTick(next, Number(tickSpeed));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStep = async () => {
    try {
      await kernelApi.stepCpu();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpeedChange = async (val) => {
    setTickSpeed(val);
    try {
      await kernelApi.setAutoTick(autoTick, Number(val));
    } catch (err) {
      console.error(err);
    }
  };

  const handleKill = async (pid) => {
    try {
      await kernelApi.killProcess(pid);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProcess = async (e) => {
    e.preventDefault();
    try {
      await kernelApi.runProcess(
        newProcName,
        Number(newProcBurst),
        Number(newProcPriority),
        Number(newProcRam)
      );
      setShowNewProcModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePolicyChange = async (policy) => {
    setMemoryPolicy(policy);
    try {
      await kernelApi.setMemoryPolicy(policy);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 text-slate-100 select-text">
      {/* Top Tab Bar & Quick Stats */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('cpu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'cpu'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>CPU Scheduler (CO1 & CO2)</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Virtual Memory & Paging (CO2 & CO3)</span>
          </button>
        </div>

        {/* Global Controls: Step, Auto-tick, Clear Terminated, New Process */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleStep}
            title="Step 1 CPU Clock Cycle"
            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step Tick</span>
          </button>

          <button
            onClick={handleToggleAutoTick}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer ${
              autoTick
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {autoTick ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoTick ? 'Pause Ticker' : 'Auto Ticker'}</span>
          </button>

          <button
            onClick={async () => {
              try {
                await kernelApi.clearTerminatedProcesses();
                onRefresh();
              } catch (e) {
                console.error(e);
              }
            }}
            title="Remove completed processes from table"
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Clean PCB</span>
          </button>

          <button
            onClick={() => setShowNewProcModal(true)}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Process</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'cpu' ? (
          <>
            {/* CPU Control Toolbar */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 font-medium">Scheduling Algorithm:</span>
                <div className="flex items-center space-x-1.5">
                  {['FCFS', 'SJF', 'Priority', 'RoundRobin'].map((algo) => (
                    <button
                      key={algo}
                      onClick={() => handleAlgoChange(algo)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        selectedAlgo === algo
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {algo === 'RoundRobin' ? 'Round Robin (RR)' : algo}
                    </button>
                  ))}
                </div>

                {selectedAlgo === 'RoundRobin' && (
                  <div className="flex items-center space-x-1.5 ml-2 pl-3 border-l border-white/10">
                    <span className="text-slate-400">Quantum:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={quantum}
                      onChange={(e) => handleQuantumChange(e.target.value)}
                      className="w-12 px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-center text-white"
                    />
                    <span className="text-slate-500 text-[10px]">ticks</span>
                  </div>
                )}
              </div>

              {/* Ticker Speed Slider */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Tick Speed:</span>
                <input
                  type="range"
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  value={tickSpeed}
                  onChange={(e) => handleSpeedChange(e.target.value)}
                  className="w-24 accent-sky-400 cursor-pointer"
                />
                <span className="text-slate-400 w-8">{tickSpeed}s</span>
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  CPU Utilization
                </div>
                <div className="text-xl font-bold text-sky-400 mt-1">
                  {cpu.cpu_utilization_percent ?? 0}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Over recent Gantt window</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Active Processes
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {cpu.active_processes_count ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Running / Ready / Blocked
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Avg Waiting Time
                </div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {cpu.average_waiting_time ?? 0} ticks
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">For completed tasks</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Avg Turnaround
                </div>
                <div className="text-xl font-bold text-purple-400 mt-1">
                  {cpu.average_turnaround_time ?? 0} ticks
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Arrival to termination</div>
              </div>
            </div>

            {/* Live Gantt Chart */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Live Execution Gantt Chart</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Current Tick: <strong className="text-white">{cpu.current_tick}</strong>
                </span>
              </div>

              {/* Gantt strip */}
              <div className="h-10 w-full bg-slate-900/90 rounded-lg p-1 flex items-center space-x-1 overflow-x-auto border border-white/10">
                {gantt.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center w-full">
                    Awaiting execution ticks...
                  </div>
                ) : (
                  gantt.map((g, idx) => (
                    <div
                      key={idx}
                      title={`Tick #${g.tick} - ${g.name} ${g.pid ? `(PID: ${g.pid})` : ''}`}
                      style={{ backgroundColor: g.color || '#334155' }}
                      className="h-full min-w-[28px] flex-1 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-all hover:scale-105 select-none"
                    >
                      {g.name === 'IDLE' ? '·' : g.name.substring(0, 3)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Process Control Block (PCB) Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Process Control Block (PCB) Table
                </span>
                <span className="text-[11px] text-slate-400">
                  Total registered: {processes.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2">PID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2">Burst</th>
                      <th className="px-3 py-2">Remaining</th>
                      <th className="px-3 py-2">RAM (MB)</th>
                      <th className="px-3 py-2">Progress</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {processes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-6 text-slate-500">
                          No processes currently in memory.
                        </td>
                      </tr>
                    ) : (
                      processes.map((p) => {
                        const isRunning = p.state === 'RUNNING';
                        const isTerm = p.state === 'TERMINATED';
                        return (
                          <tr
                            key={p.pid}
                            className={`hover:bg-white/[0.03] transition-colors ${
                              isRunning ? 'bg-sky-500/10' : ''
                            }`}
                          >
                            <td className="px-3 py-2 font-mono text-slate-400">{p.pid}</td>
                            <td className="px-3 py-2 font-medium flex items-center space-x-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-white">{p.name}</span>
                              {p.is_system && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400">
                                  sys
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isRunning
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                                    : p.state === 'READY'
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : p.state === 'BLOCKED'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}
                              >
                                {p.state}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-300">{p.priority}</td>
                            <td className="px-3 py-2 text-slate-300">{p.burst_time}t</td>
                            <td className="px-3 py-2 text-slate-300 font-mono">
                              {p.remaining_time}t
                            </td>
                            <td className="px-3 py-2 text-slate-300">{p.ram_mb} MB</td>
                            <td className="px-3 py-2 w-32">
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${p.progress_percent}%`,
                                    backgroundColor: p.color,
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {!isTerm && (
                                <button
                                  onClick={() => handleKill(p.pid)}
                                  title="Kill Process (SIGKILL)"
                                  className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* MEMORY & PAGING TAB */
          <>
            {/* Memory Toolbar & Policy Selector */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 font-medium">Page Replacement Policy:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePolicyChange('LRU')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      memoryPolicy === 'LRU'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Least Recently Used (LRU)
                  </button>
                  <button
                    onClick={() => handlePolicyChange('FIFO')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      memoryPolicy === 'FIFO'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    First-In First-Out (FIFO)
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Total Physical RAM: <strong className="text-white">128 MB</strong> (32 frames × 4 MB)
              </div>
            </div>

            {/* Memory Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Used RAM
                </div>
                <div className="text-xl font-bold text-purple-400 mt-1">
                  {memory.used_ram_mb ?? 0} MB
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {memory.used_frames ?? 0} / 32 Frames ({memory.usage_percent ?? 0}%)
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Free RAM
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {memory.free_ram_mb ?? 128} MB
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {memory.free_frames ?? 32} Frames available
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Page Faults
                </div>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {memory.page_faults ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Misses requiring allocation</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Page Hits
                </div>
                <div className="text-xl font-bold text-sky-400 mt-1">
                  {memory.page_hits ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Fault Rate: {memory.fault_rate_percent ?? 0}%
                </div>
              </div>
            </div>

            {/* 32-Frame RAM Allocation Grid */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Physical RAM Frame Allocation Table (32 Frames)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Click any frame to inspect details
                </span>
              </div>

              {/* 32 Grid Blocks */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {frames.map((frame) => {
                  const isAlloc = frame.is_allocated;
                  const isSelected = selectedFrame?.frame_id === frame.frame_id;
                  return (
                    <button
                      key={frame.frame_id}
                      onClick={() => setSelectedFrame(frame)}
                      style={{
                        backgroundColor: isAlloc ? frame.color : '#1e293b',
                        borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)',
                      }}
                      className={`h-16 rounded-xl p-1.5 flex flex-col justify-between text-left border transition-all hover:scale-105 cursor-pointer shadow-sm ${
                        isSelected ? 'ring-2 ring-purple-400 shadow-lg' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
                        <span>F{frame.frame_id}</span>
                        <span className="text-[8px] bg-black/40 px-1 rounded">4MB</span>
                      </div>
                      <div className="truncate text-[10px] font-semibold text-white">
                        {isAlloc ? frame.app_name : 'FREE'}
                      </div>
                      <div className="text-[9px] text-white/80 flex items-center justify-between">
                        <span>{isAlloc ? `P${frame.page_num}` : '-'}</span>
                        <span className="text-[8px] text-white/60">
                          {isAlloc ? `PID:${frame.pid}` : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Frame Detail Banner */}
              {selectedFrame && (
                <div className="p-3 rounded-lg bg-slate-900/90 border border-white/15 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-purple-300">
                      Frame #{selectedFrame.frame_id} Details:
                    </span>
                    <span className="ml-2 text-slate-300">
                      {selectedFrame.is_allocated
                        ? `Allocated to ${selectedFrame.app_name} (PID: ${selectedFrame.pid}, Page #${selectedFrame.page_num})`
                        : 'Currently Unallocated (Free)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-x-3">
                    <span>Allocated at: tick {selectedFrame.allocated_at_tick}</span>
                    <span>Last accessed: tick {selectedFrame.last_accessed_tick}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Eviction & Swap Log */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <div className="px-4 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recent Page Replacement & Eviction Log</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Algorithm: {memory.replacement_policy}
                </span>
              </div>
              <div className="p-3 text-xs max-h-36 overflow-y-auto space-y-1 font-mono">
                {!memory.swap_history || memory.swap_history.length === 0 ? (
                  <div className="text-slate-500 text-center py-2">
                    No page replacements triggered yet. Trigger "Simulate Heavy Load" to fill RAM.
                  </div>
                ) : (
                  memory.swap_history.map((s, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded bg-black/30 border border-white/5 flex items-center justify-between text-slate-300 text-[11px]"
                    >
                      <span>
                        [Tick {s.tick}] Page fault: Evicted{' '}
                        <strong className="text-rose-400">{s.evicted_app}</strong> (PID {s.evicted_pid})
                        from Frame #{s.frame_id}
                      </span>
                      <span className="text-emerald-400">
                        → Loaded <strong>{s.new_app}</strong> (PID {s.new_pid}) [{s.policy}]
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Process Modal */}
      {showNewProcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel p-5 border border-white/20 shadow-2xl text-xs space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Spawn New Process</span>
            </h3>

            <form onSubmit={handleCreateProcess} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Process Name:</label>
                <input
                  type="text"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Burst (Ticks):</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newProcBurst}
                    onChange={(e) => setNewProcBurst(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Priority (1-5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newProcPriority}
                    onChange={(e) => setNewProcPriority(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">RAM (MB):</label>
                  <input
                    type="number"
                    min={4}
                    max={64}
                    step={4}
                    value={newProcRam}
                    onChange={(e) => setNewProcRam(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProcModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer shadow-md"
                >
                  Spawn Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
