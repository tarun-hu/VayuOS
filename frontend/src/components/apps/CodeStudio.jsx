import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  Save,
  FileCode,
  FileText,
  Terminal,
  Folder,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Copy,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { kernelApi } from '../../api/kernelApi';

const CODE_TEMPLATES = {
  primes: {
    name: 'Prime Number Sieve',
    code: `# Sieve of Eratosthenes Algorithm
import math
import time

def sieve(limit):
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(math.isqrt(limit)) + 1):
        if is_prime[i]:
            for j in range(i * i, limit + 1, i):
                is_prime[j] = False
    return [x for x in range(limit + 1) if is_prime[x]]

t0 = time.time()
primes_list = sieve(60)
dt = round((time.time() - t0) * 1000, 3)

print("========================================")
print("🚀 VayuOS CodeRunner Engine v2.5")
print("========================================")
print(f"Calculated {len(primes_list)} prime numbers up to 60 in {dt} ms:")
print(primes_list)
print("\\n[OK] Algorithm executed cleanly on Python runtime!")
`,
  },
  fibonacci: {
    name: 'Fibonacci & Dynamic Programming',
    code: `# Fibonacci with Dynamic Programming & Memoization
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("Fibonacci Sequence up to N=30:")
results = [fib_memo(i) for i in range(16)]
for idx, val in enumerate(results):
    print(f"Fib({idx:02d}) = {val}")

print("\\n[OK] Dynamic Programming recursion verified!")
`,
  },
  scheduling: {
    name: 'CPU Scheduling Simulation (RR)',
    code: `# Round Robin Simulation in Python
class Process:
    def __init__(self, pid, name, burst):
        self.pid = pid
        self.name = name
        self.burst = burst
        self.remaining = burst

processes = [
    Process(101, "WorkerA", 10),
    Process(102, "WorkerB", 5),
    Process(103, "WorkerC", 8),
]
quantum = 3
time_step = 0
queue = list(processes)

print(f"Simulating Round Robin with Quantum = {quantum} ticks:\\n")
while queue:
    p = queue.pop(0)
    exec_time = min(quantum, p.remaining)
    p.remaining -= exec_time
    time_step += exec_time
    print(f"[Tick {time_step:02d}] {p.name} executed for {exec_time} ticks (Remaining: {p.remaining})")
    if p.remaining > 0:
        queue.append(p)
    else:
        print(f"  --> Process {p.name} (PID: {p.pid}) TERMINATED at tick {time_step}!")

print(f"\\nAll tasks completed in {time_step} total ticks.")
`,
  },
  matrix: {
    name: 'Matrix Multiplication & Benchmarking',
    code: `# 3x3 Matrix Multiplication
A = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
B = [
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1]
]

C = [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

print("Matrix A:")
for r in A: print(" ", r)
print("Matrix B:")
for r in B: print(" ", r)
print("\\nResult Matrix (A x B):")
for r in C: print(" ", r)
`,
  },
  system_info: {
    name: 'OS & System Inspection',
    code: `# Inspect Python Runtime & System Environment
import sys
import platform
import os

print("Python Version:", sys.version)
print("Platform Architecture:", platform.machine(), platform.system())
print("Working Directory:", os.getcwd())
print("Byte Order:", sys.byteorder)
print("Recursion Limit:", sys.getrecursionlimit())
print("\\nSystem environment verified successfully!")
`,
  },
};

export default function CodeStudio({ onRefresh }) {
  const [activeFile, setActiveFile] = useState('/Users/guest/main.py');
  const [activeFileName, setActiveFileName] = useState('main.py');
  const [code, setCode] = useState(CODE_TEMPLATES.primes.code);
  const [filesList, setFilesList] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [outputConsole, setOutputConsole] = useState({
    stdout: '',
    stderr: '',
    duration_ms: null,
    runner_pid: null,
    frames_used: [],
    exit_code: null,
  });
  const [isSaved, setIsSaved] = useState(true);
  const [copyStatus, setCopyStatus] = useState(false);
  const textareaRef = useRef(null);
  const consoleBottomRef = useRef(null);

  // Load files from /Users/guest
  const loadFiles = async (shouldLoadContent = false) => {
    try {
      const res = await kernelApi.listFiles('/Users/guest');
      const filtered = (res.files || []).filter((f) => f.type === 'file');
      setFilesList(filtered);

      if (shouldLoadContent) {
        const fileRes = await kernelApi.readFile(activeFile).catch(() => null);
        if (fileRes && fileRes.content) {
          setCode(fileRes.content);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFiles(true);
  }, []);

  const handleSelectFile = async (file) => {
    try {
      const res = await kernelApi.readFile(file.path);
      setActiveFile(file.path);
      setActiveFileName(file.name);
      setCode(res.content || '');
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTemplateSelect = (key) => {
    if (CODE_TEMPLATES[key]) {
      setCode(CODE_TEMPLATES[key].code);
      setIsSaved(false);
    }
  };

  const handleSave = async () => {
    try {
      await kernelApi.writeFile(activeFile, code);
      setIsSaved(true);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutputConsole({
      stdout: '[Kernel] Spawning CodeRunner process in CPU Scheduler...\n[Kernel] Allocating 16 MB Physical RAM (4 frames)...\n[Kernel] Executing Python snippet...\n',
      stderr: '',
      duration_ms: null,
      runner_pid: null,
      frames_used: [],
      exit_code: null,
    });

    onRefresh();

    try {
      const res = await kernelApi.executeCode(code, activeFileName);
      setIsRunning(false);
      setOutputConsole({
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        duration_ms: res.duration_ms,
        runner_pid: res.runner_pid,
        frames_used: res.frames_used || [],
        exit_code: res.exit_code,
      });

      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      onRefresh();
    } catch (err) {
      setIsRunning(false);
      setOutputConsole({
        stdout: '',
        stderr: `Execution Error: ${err.message}`,
        duration_ms: 0,
        runner_pid: null,
        frames_used: [],
        exit_code: 1,
      });
    }
  };

  // Keyboard support: Tab key inserts 4 spaces, Cmd/Ctrl+S saves, Cmd/Ctrl+Enter runs!
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = textareaRef.current;
      if (!target) return;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setIsSaved(false);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
  };

  const handleCopyOutput = () => {
    const textToCopy = outputConsole.stdout || outputConsole.stderr;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const handleClearConsole = () => {
    setOutputConsole({
      stdout: '',
      stderr: '',
      duration_ms: null,
      runner_pid: null,
      frames_used: [],
      exit_code: null,
    });
  };

  const lines = code.split('\n');

  return (
    <div
      onKeyDown={handleKeyDown}
      className="flex h-full bg-slate-950/90 text-slate-100 select-none overflow-hidden"
    >
      {/* Left Sidebar: File Explorer & Preset Code Library */}
      <div className="w-56 border-r border-white/10 bg-white/[0.02] flex flex-col justify-between text-xs">
        <div className="overflow-y-auto">
          {/* Files List */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-white/10">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Files
            </span>
            <button
              onClick={loadFiles}
              title="Refresh Files"
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-semibold px-2 py-1 flex items-center space-x-1">
              <Folder className="w-3 h-3 text-sky-400" />
              <span>/Users/guest</span>
            </div>
            {filesList.map((file) => {
              const isSelected = activeFile === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {file.name.endsWith('.py') ? (
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Preset Algorithms */}
          <div className="mt-2 border-t border-white/10 p-2">
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider px-2 py-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Quick Code Presets</span>
            </div>
            <div className="space-y-1 mt-1">
              {Object.entries(CODE_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateSelect(key)}
                  className="w-full px-2 py-1 rounded text-left text-[11px] text-slate-300 hover:bg-purple-500/20 hover:text-purple-200 transition-colors cursor-pointer truncate"
                  title={tpl.name}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Process Info Callout */}
        <div className="p-3 bg-white/[0.02] border-t border-white/10 space-y-1 text-[11px]">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Process Spawning (CO1 & CO3):</span>
          </div>
          <div className="text-slate-400 text-[10px] leading-relaxed">
            Runs via <code>/api/code/execute</code>. Spawns <strong>CodeRunner</strong> in CPU Scheduler with <strong>16 MB RAM</strong> (4 frames).
          </div>
        </div>
      </div>

      {/* Main Editor & Console Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Tab Bar & Controls */}
        <div className="h-10 px-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs">
          {/* Active File Tab */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 rounded-t-lg bg-slate-900 border-t border-x border-white/15 text-slate-200 font-medium flex items-center space-x-2 shadow-sm">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeFileName}</span>
              {!isSaved && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            </div>
          </div>

          {/* Action Buttons: Save & Run Code */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Save to Virtual Disk (Cmd/Ctrl + S)"
            >
              <Save className="w-3.5 h-3.5 text-sky-400" />
              <span>Save</span>
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`px-3.5 py-1 rounded-lg text-white font-semibold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer ${
                isRunning
                  ? 'bg-emerald-600/50 cursor-not-allowed animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              title="Run Python Code (Cmd/Ctrl + Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running on CPU...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* Code Editor Body with Line Numbers */}
        <div className="flex-1 flex overflow-hidden bg-slate-950 font-mono text-xs select-text">
          {/* Line Numbers Gutter */}
          <div className="w-12 py-3 pr-2 text-right text-slate-600 select-none bg-slate-950/80 border-r border-white/5 leading-6">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Textarea with Tab Support */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setIsSaved(false);
            }}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent text-slate-100 outline-none resize-none leading-6 font-mono whitespace-pre overflow-auto"
          />
        </div>

        {/* Bottom Output Console */}
        <div className="h-44 border-t border-white/10 bg-slate-950 flex flex-col font-mono text-xs">
          {/* Console Header */}
          <div className="h-8 px-4 bg-white/[0.04] border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-200">Terminal Output Console</span>
              {outputConsole.runner_pid && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  PID: {outputConsole.runner_pid} | 16MB RAM
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {outputConsole.duration_ms !== null && (
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400">Time: {outputConsole.duration_ms}ms</span>
                  <span className="text-slate-500">|</span>
                  <span
                    className={outputConsole.exit_code === 0 ? 'text-emerald-400' : 'text-rose-400'}
                  >
                    Exit Code: {outputConsole.exit_code}
                  </span>
                </div>
              )}
              {(outputConsole.stdout || outputConsole.stderr) && (
                <>
                  <button
                    onClick={handleCopyOutput}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                    title="Copy Output"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleClearConsole}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Clear Console"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Console Text */}
          <div className="flex-1 p-3 overflow-y-auto select-text space-y-1">
            {isRunning && (
              <div className="text-amber-400 animate-pulse">
                [Kernel] Running CodeRunner process on CPU...
              </div>
            )}
            {outputConsole.stdout && (
              <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {outputConsole.stdout}
              </div>
            )}
            {outputConsole.stderr && (
              <div className="text-rose-400 whitespace-pre-wrap leading-relaxed">
                {outputConsole.stderr}
              </div>
            )}
            {!isRunning && !outputConsole.stdout && !outputConsole.stderr && (
              <div className="text-slate-600 italic">
                Press 'Run Code' (or Cmd/Ctrl + Enter) to execute this script in VayuOS Kernel.
              </div>
            )}
            <div ref={consoleBottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
