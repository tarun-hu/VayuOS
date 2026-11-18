import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { kernelApi } from '../../api/kernelApi';

export default function DeadlockLab({ kernelState, onRefresh }) {
  const [selectedProcess, setSelectedProcess] = useState('Process-1 (RenderEngine)');
  const [selectedResource, setSelectedResource] = useState('Printer');
  const [recoveryMsg, setRecoveryMsg] = useState(null);

  const deadlock = kernelState?.deadlock || {};
  const isDeadlocked = deadlock.is_deadlocked ?? false;
  const cycle = deadlock.cycle || [];
  const bankers = deadlock.bankers_safety || {};
  const nodes = deadlock.graph_nodes || [];
  const edges = deadlock.graph_edges || [];
  const available = deadlock.available_resources || {};
  const allocations = deadlock.allocations || {};
  const requests = deadlock.requests || {};
  const maxClaims = deadlock.max_claims || {};

  const handleTriggerPreset = async () => {
    try {
      await kernelApi.triggerDeadlockPreset();
      setRecoveryMsg(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoRecover = async () => {
    try {
      const res = await kernelApi.autoRecoverDeadlock();
      if (res.recovered) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      setRecoveryMsg(res.message);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequest = async () => {
    try {
      await kernelApi.requestResource(selectedProcess, selectedResource, 1);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRelease = async () => {
    try {
      await kernelApi.releaseResource(selectedProcess, selectedResource, 1);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const processNames = Object.keys(allocations);
  const resourceNames = Object.keys(deadlock.total_resources || {});

  return (
    <div className="flex flex-col h-full bg-slate-950/80 text-slate-100 select-text p-4 space-y-4 overflow-y-auto">
      {/* Top Banner Alert */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
          isDeadlocked
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isDeadlocked ? (
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          )}
          <div>
            <div className="text-sm font-bold flex items-center space-x-2">
              <span>{isDeadlocked ? 'DEADLOCK DETECTED! (Circular Wait Cycle)' : 'SYSTEM HEALTHY: No Deadlock Detected'}</span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {isDeadlocked
                ? `Cycle detected in Resource Allocation Graph: ${cycle.join(' → ')}`
                : 'Resource Allocation Graph is acyclic. Processes can proceed safely.'}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isDeadlocked ? (
            <button
              onClick={handleAutoRecover}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 cursor-pointer animate-pulse"
            >
              <Zap className="w-4 h-4" />
              <span>Auto-Recover (Terminate Victim)</span>
            </button>
          ) : (
            <button
              onClick={handleTriggerPreset}
              className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Trigger Circular Wait Preset</span>
            </button>
          )}
        </div>
      </div>

      {/* Recovery notification message */}
      {recoveryMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{recoveryMsg}</span>
        </div>
      )}

      {/* Interactive RAG Graph Visualizer */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Resource Allocation Graph (RAG) Nodes & Edges</span>
          </span>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Assignment (Holding)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Request (Waiting)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Deadlocked Cycle</span>
            </span>
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Processes Column */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
              Processes (Circles)
            </div>
            <div className="space-y-2">
              {processNames.length === 0 ? (
                <div className="text-slate-500 text-xs py-3 text-center">
                  No active processes in RAG. Click "Trigger Circular Wait Preset".
                </div>
              ) : (
                processNames.map((p) => {
                  const isInCycle = cycle.includes(`P:${p}`);
                  const isDead = isDeadlocked && isInCycle;
                  const holding = Object.entries(allocations[p] || {})
                    .filter(([_, cnt]) => cnt > 0)
                    .map(([r, cnt]) => `${r} (${cnt})`);
                  const requesting = Object.entries(requests[p] || {})
                    .filter(([_, cnt]) => cnt > 0)
                    .map(([r, cnt]) => `${r} (${cnt})`);

                  return (
                    <div
                      key={p}
                      className={`p-2.5 rounded-lg border transition-all text-xs ${
                        isDead
                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 ring-1 ring-rose-500'
                          : 'bg-white/[0.02] border-white/10 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                          <span>{p}</span>
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {isDead && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              LOCKED IN CYCLE
                            </span>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await kernelApi.terminateDeadlockProcess(p);
                                onRefresh();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            title="Terminate process to break deadlock"
                            className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] cursor-pointer"
                          >
                            Terminate
                          </button>
                        </div>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-[11px]">
                        <div className="text-emerald-400">
                          Holding: {holding.length > 0 ? holding.join(', ') : 'None'}
                        </div>
                        <div className="text-amber-400">
                          Waiting for: {requesting.length > 0 ? requesting.join(', ') : 'None'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Resources Column */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Shared Resources (Rectangles)
            </div>
            <div className="space-y-2">
              {resourceNames.map((r) => {
                const total = deadlock.total_resources?.[r] ?? 1;
                const avail = available[r] ?? 0;
                const isInCycle = cycle.includes(`R:${r}`);

                return (
                  <div
                    key={r}
                    className={`p-2.5 rounded-lg border transition-all text-xs ${
                      isInCycle
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 ring-1 ring-rose-500'
                        : 'bg-white/[0.02] border-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded bg-purple-400" />
                        <span>{r}</span>
                      </span>
                      <span className="text-[11px] text-slate-300">
                        Available: <strong>{avail}</strong> / {total}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-1.5">
                      {Array.from({ length: total }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${
                            i < avail ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {i < avail ? '✓' : '✗'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Directed Edge Flow Details */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs">
          <div className="font-semibold text-slate-300 mb-1">Active Edges:</div>
          <div className="flex flex-wrap gap-2">
            {edges.length === 0 ? (
              <span className="text-slate-500">No active edges.</span>
            ) : (
              edges.map((e, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    e.in_cycle
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : e.type === 'assignment'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {e.from} → {e.to} ({e.count})
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Banker's Algorithm Safety Status & Matrices */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Banker's Algorithm State & Safe Sequence Calculation</span>
          </span>
          <div className="text-[11px]">
            System Safety:{' '}
            <strong className={bankers.is_safe ? 'text-emerald-400' : 'text-rose-400'}>
              {bankers.is_safe ? 'SAFE STATE' : 'UNSAFE STATE'}
            </strong>
          </div>
        </div>

        {/* Safe Sequence Banner */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs flex items-center justify-between">
          <span className="text-slate-400">Safe Execution Order:</span>
          {bankers.safe_sequence && bankers.safe_sequence.length > 0 ? (
            <div className="flex items-center space-x-1.5 font-bold text-emerald-400 font-mono">
              {bankers.safe_sequence.map((p, i) => (
                <React.Fragment key={p}>
                  <span>{p}</span>
                  {i < bankers.safe_sequence.length - 1 && <span>→</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-rose-400 font-bold">No Safe Sequence Exists (Unsafe)</span>
          )}
        </div>

        {/* Matrices Table */}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="px-3 py-2">Process</th>
                <th className="px-3 py-2">Allocated</th>
                <th className="px-3 py-2">Max Claim</th>
                <th className="px-3 py-2">Need (Max - Alloc)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processNames.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-slate-500">
                    No process claims registered.
                  </td>
                </tr>
              ) : (
                processNames.map((p) => {
                  const allocStr = resourceNames
                    .map((r) => `${r}: ${allocations[p]?.[r] || 0}`)
                    .join(' | ');
                  const maxStr = resourceNames
                    .map((r) => `${r}: ${maxClaims[p]?.[r] || 1}`)
                    .join(' | ');
                  const needStr = resourceNames
                    .map((r) => `${r}: ${bankers.need?.[p]?.[r] ?? 0}`)
                    .join(' | ');

                  return (
                    <tr key={p} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-medium text-white">{p}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400 text-[11px]">{allocStr}</td>
                      <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">{maxStr}</td>
                      <td className="px-3 py-2 font-mono text-amber-400 text-[11px]">{needStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Request & Release Controls */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Process:</span>
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="px-2 py-1 rounded bg-black/40 border border-white/20 text-white outline-none"
          >
            {processNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <span className="text-slate-400 ml-2">Resource:</span>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="px-2 py-1 rounded bg-black/40 border border-white/20 text-white outline-none"
          >
            {resourceNames.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRequest}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium cursor-pointer"
          >
            Request Resource
          </button>
          <button
            onClick={handleRelease}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-medium cursor-pointer"
          >
            Release Resource
          </button>
        </div>
      </div>
    </div>
  );
}
