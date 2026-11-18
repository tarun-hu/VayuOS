import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Cpu, HardDrive, ShieldCheck, Terminal, Layers } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-2xl rounded-2xl glass-panel border border-white/25 overflow-hidden shadow-2xl text-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl"></span>
              <h2 className="text-base font-bold text-white tracking-wide">
                About VayuOS & OS Viva Reference Guide
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
            {/* System Overview */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-indigo-500/10 border border-sky-500/20">
              <h3 className="text-sm font-semibold text-sky-300 flex items-center space-x-2 mb-1">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>VayuOS v2.5 Architecture</span>
              </h3>
              <p className="text-slate-300">
                A dual-engine operating system simulation with a real Python FastAPI OS Kernel
                running live CPU scheduling, paging algorithms, persistent disk allocation, and
                deadlock detection/recovery, coupled with a macOS Sonoma/Sequoia glassmorphic React frontend.
              </p>
            </div>

            {/* Course Outcomes Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center space-x-2 text-sky-400 font-semibold mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>CO1 & CO2: CPU Scheduling</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  PCB management with live switching between FCFS, SJF (SRTF), Priority, and
                  Round Robin (configurable quantum). Real-time Gantt chart visualization.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
                  <HardDrive className="w-4 h-4" />
                  <span>CO2 & CO3: Virtual Memory & Paging</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  128 MB RAM divided into 32 frames (4 MB each). FIFO & LRU page replacement,
                  page fault tracking, and real-time frame ownership map.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CO2: Deadlock Management</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Resource Allocation Graph (RAG) cycle detection, Banker's Algorithm safe
                  sequence calculation, circular wait deadlock presets, and victim recovery.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center space-x-2 text-purple-400 font-semibold mb-1">
                  <Terminal className="w-4 h-4" />
                  <span>CO4: Persistent File System</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  64-block disk allocation table with Contiguous, Linked, and Indexed strategy
                  visualization. Persists to <code>virtual_disk.json</code> on host machine.
                </p>
              </div>
            </div>

            {/* Viva Checklist */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
              <h4 className="font-semibold text-slate-200">Examiner Demonstration Checklist:</h4>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Activity Monitor:</strong> Switch to Round Robin, set Quantum=2, click 'Step 1 Tick'.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Memory Paging:</strong> Click 'Simulate Heavy Load' from 1-Click Viva Menu to trigger page swaps.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Deadlock Lab:</strong> Click 'Trigger Deadlock Preset', inspect circular wait, then click 'Auto-Recover'.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Finder:</strong> Open 64-Block Disk Map and toggle between Contiguous, Linked, and Indexed modes.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Code Studio:</strong> Click 'Run Code' to spawn temporary 16MB CodeRunner process with output.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/10 flex justify-end bg-white/[0.02]">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors text-xs"
            >
              Close & Return to Desktop
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
