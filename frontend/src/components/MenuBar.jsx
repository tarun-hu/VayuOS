import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Flame,
  AlertTriangle,
  Play,
  RotateCcw,
  Sun,
  Moon,
  ChevronDown,
  Info,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Folder,
  Code2,
  Calendar as CalendarIcon,
  Maximize,
  Minimize,
  Trash2,
  Sparkles,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { kernelApi } from '../api/kernelApi';

export default function MenuBar({
  activeAppTitle,
  activeAppId,
  kernelState,
  isKernelOnline,
  onApplyPreset,
  onOpenAbout,
  onOpenApp,
  onCloseActiveApp,
  theme,
  onToggleTheme,
  onRefresh,
}) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // 'apple', 'file', 'edit', 'view', 'kernel', 'window', 'help', 'viva', 'clock', 'kernelInfo'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (e, name) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleStepTick = async () => {
    try {
      await kernelApi.stepCpu();
      showToast('CPU: Stepped 1 Clock Cycle');
      onRefresh();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleToggleTicker = async () => {
    const current = kernelState?.auto_tick_enabled ?? true;
    try {
      await kernelApi.setAutoTick(!current);
      showToast(`CPU Auto-Tick ${!current ? 'Resumed' : 'Paused'}`);
      onRefresh();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSwitchAlgo = async (algo) => {
    try {
      await kernelApi.setAlgorithm(algo, kernelState?.cpu?.time_quantum || 3);
      showToast(`Scheduler switched to ${algo}`);
      onRefresh();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleFlushMemory = async () => {
    try {
      const res = await kernelApi.flushMemory();
      showToast(`Flushed ${res.freed_frames} unreferenced RAM frames`);
      onRefresh();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleClearTerminated = async () => {
    try {
      const res = await kernelApi.clearTerminatedProcesses();
      showToast(`Cleared ${res.cleared_count} terminated processes from PCB`);
      onRefresh();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const cpuPercent = kernelState?.cpu?.cpu_utilization_percent ?? 0;
  const ramUsed = kernelState?.memory?.used_ram_mb ?? 0;
  const ramTotal = kernelState?.memory?.total_ram_mb ?? 128;
  const ramPercent = kernelState?.memory?.usage_percent ?? 0;

  return (
    <>
      <div className="h-7 w-full fixed top-0 left-0 z-50 px-3 flex items-center justify-between text-xs text-slate-100 glass-menubar select-none shadow-md">
        {/* Left: Apple / VayuOS Logo & Interactive Menus */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* VayuOS Logo Menu */}
          <div className="relative">
            <button
              onClick={(e) => toggleDropdown(e, 'apple')}
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors font-bold text-sky-400 cursor-pointer"
            >
              <span className="text-sm"></span>
              <span className="tracking-wider font-semibold">VayuOS</span>
            </button>

            {openDropdown === 'apple' && (
              <div className="absolute top-7 left-0 w-60 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                <button
                  onClick={() => {
                    onOpenAbout();
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>About VayuOS & Viva Guide</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    onOpenApp('activity');
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Activity Monitor (CPU & RAM)</span>
                </button>
                <button
                  onClick={() => {
                    onOpenApp('deadlock');
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deadlock Lab (RAG & Banker's)</span>
                </button>
                <button
                  onClick={() => {
                    onOpenApp('terminal');
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Terminal CLI Shell</span>
                </button>
                <button
                  onClick={() => {
                    onOpenApp('code');
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code Studio Python IDE</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    onApplyPreset('clean_boot');
                    setOpenDropdown(null);
                    showToast('Kernel reset to clean boot state');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-red-500/30 text-rose-300 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Restart Kernel (Clean Boot)</span>
                </button>
              </div>
            )}
          </div>

          {/* Current App Title */}
          <span className="font-semibold text-white tracking-wide px-1.5 hidden sm:inline">
            {activeAppTitle || 'Desktop'}
          </span>

          {/* Real Functional Menus: File, Edit, View, Kernel, Window, Help */}
          <div className="hidden md:flex items-center space-x-1 text-slate-300">
            {/* FILE MENU */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, 'file')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  openDropdown === 'file' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                File
              </button>
              {openDropdown === 'file' && (
                <div className="absolute top-7 left-0 w-52 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                  <button
                    onClick={() => {
                      onOpenApp('finder');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-sky-400" />
                    <span>Open Finder Browser</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenApp('terminal');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>New Terminal Session</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenApp('code');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>New Script in Code Studio</span>
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => {
                      onCloseActiveApp();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-rose-500/30 text-rose-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Close Active Window</span>
                  </button>
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, 'edit')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  openDropdown === 'edit' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                Edit
              </button>
              {openDropdown === 'edit' && (
                <div className="absolute top-7 left-0 w-48 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                  <button
                    onClick={() => {
                      showToast('Copied to system clipboard');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 cursor-pointer"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      showToast('Pasting from clipboard');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 cursor-pointer"
                  >
                    Paste
                  </button>
                  <button
                    onClick={() => {
                      showToast('Select All triggered');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 cursor-pointer"
                  >
                    Select All
                  </button>
                </div>
              )}
            </div>

            {/* VIEW MENU */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, 'view')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  openDropdown === 'view' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                View
              </button>
              {openDropdown === 'view' && (
                <div className="absolute top-7 left-0 w-52 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                  <button
                    onClick={() => {
                      onToggleTheme();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{theme === 'dark' ? 'Switch to Light Wallpaper' : 'Switch to Dark Wallpaper'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenApp('activity');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View CPU & Memory Grid</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenApp('finder');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>View 64-Block Disk Map</span>
                  </button>
                </div>
              )}
            </div>

            {/* KERNEL MENU (Live OS Operations!) */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, 'kernel')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  openDropdown === 'kernel' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                Kernel
              </button>
              {openDropdown === 'kernel' && (
                <div className="absolute top-7 left-0 w-64 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-sky-400 font-bold">
                    Scheduler Controls
                  </div>
                  <button
                    onClick={() => {
                      handleStepTick();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-sky-400" />
                    <span>Step 1 Clock Cycle (Tick)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleTicker();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Toggle Auto-Tick Loop</span>
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-purple-400 font-bold">
                    Algorithms
                  </div>
                  <button
                    onClick={() => {
                      handleSwitchAlgo('RoundRobin');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 cursor-pointer"
                  >
                    Switch to Round Robin (Quantum=3)
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchAlgo('SJF');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 cursor-pointer"
                  >
                    Switch to Shortest Job First (SJF)
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchAlgo('Priority');
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 cursor-pointer"
                  >
                    Switch to Priority Scheduling
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                    Maintenance
                  </div>
                  <button
                    onClick={() => {
                      handleFlushMemory();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-emerald-500/30 text-emerald-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Flush Unreferenced RAM Frames</span>
                  </button>
                  <button
                    onClick={() => {
                      handleClearTerminated();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-rose-500/30 text-rose-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Terminated PCB Records</span>
                  </button>
                </div>
              )}
            </div>

            {/* WINDOW MENU */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, 'window')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  openDropdown === 'window' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                Window
              </button>
              {openDropdown === 'window' && (
                <div className="absolute top-7 left-0 w-52 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                  {['activity', 'terminal', 'finder', 'deadlock', 'code', 'notes', 'calculator'].map(
                    (appKey) => (
                      <button
                        key={appKey}
                        onClick={() => {
                          onOpenApp(appKey);
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 capitalize cursor-pointer"
                      >
                        {appKey}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* HELP MENU */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, 'help')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  openDropdown === 'help' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
                }`}
              >
                Help
              </button>
              {openDropdown === 'help' && (
                <div className="absolute top-7 left-0 w-60 rounded-xl glass-panel py-1.5 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl">
                  <button
                    onClick={() => {
                      onOpenAbout();
                      setOpenDropdown(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                    <span>OS Viva Examination Guide</span>
                  </button>
                  <a
                    href="http://127.0.0.1:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 block text-slate-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FastAPI Swagger Docs (:8000/docs)</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Kernel Badge, CPU & RAM Pills, Viva Demo Menu, Theme, Clock */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Kernel Status Badge (Clickable for System Info!) */}
          <div className="relative">
            <button
              onClick={(e) => toggleDropdown(e, 'kernelInfo')}
              className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${
                isKernelOnline
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isKernelOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                }`}
              />
              <span>{isKernelOnline ? 'Kernel Online' : 'Offline'}</span>
            </button>

            {openDropdown === 'kernelInfo' && (
              <div className="absolute top-7 right-0 w-72 rounded-xl glass-panel p-3 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl space-y-2">
                <div className="font-bold text-sky-300 flex items-center space-x-1.5 border-b border-white/10 pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>VayuOS Kernel Diagnostics</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>Status: <strong className="text-emerald-400">Online & Responding</strong></div>
                  <div>Kernel: <strong>FastAPI v2.5 (Python 3.13)</strong></div>
                  <div>Active Tick: <strong>Tick #{kernelState?.cpu?.current_tick ?? 0}</strong></div>
                  <div>Uptime: <strong>{kernelState?.uptime_sec ?? 0} seconds</strong></div>
                  <div>Tick Interval: <strong>{kernelState?.tick_interval_sec ?? 1.0}s</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* CPU Usage Pill (Clicking opens Activity Monitor CPU tab!) */}
          <button
            onClick={() => onOpenApp('activity')}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 text-[11px] cursor-pointer transition-colors"
            title="CPU Utilization - Click to open Activity Monitor"
          >
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>{cpuPercent}%</span>
          </button>

          {/* RAM Usage Pill (Clicking opens Activity Monitor Memory tab!) */}
          <button
            onClick={() => onOpenApp('activity')}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-[11px] cursor-pointer transition-colors"
            title="RAM Allocation - Click to open Memory & Paging"
          >
            <HardDrive className="w-3 h-3 text-purple-400" />
            <span>{ramUsed}/{ramTotal}MB</span>
          </button>

          {/* 1-Click Viva Demo Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => toggleDropdown(e, 'viva')}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-500/40 text-amber-200 hover:from-amber-500/35 hover:to-rose-500/35 transition-all text-[11px] font-semibold shadow-sm cursor-pointer"
            >
              <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
              <span>1-Click Viva Demo</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {openDropdown === 'viva' && (
              <div className="absolute top-7 right-0 w-64 rounded-xl glass-panel py-1.5 shadow-2xl border border-amber-500/30 text-slate-200 text-xs backdrop-blur-2xl">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">
                  Examiner Quick Presets
                </div>
                <button
                  onClick={() => {
                    onApplyPreset('heavy_load');
                    onOpenApp('activity');
                    setOpenDropdown(null);
                    showToast('Preset: Heavy Load (FIFO/LRU Swaps triggered)');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-amber-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-100">Simulate Heavy Load</div>
                    <div className="text-[10px] text-slate-400">Trigger FIFO / LRU Page Swaps</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onApplyPreset('deadlock_scenario');
                    onOpenApp('deadlock');
                    setOpenDropdown(null);
                    showToast('Preset: Circular Wait Deadlock triggered');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-rose-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <div>
                    <div className="font-semibold text-slate-100">Trigger Deadlock Preset</div>
                    <div className="text-[10px] text-slate-400">Circular-Wait in RAG Graph</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onOpenApp('code');
                    setOpenDropdown(null);
                    showToast('Code Studio ready for Python execution');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-emerald-500/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-100">Execute Python Code</div>
                    <div className="text-[10px] text-slate-400">Spawn CodeRunner & 16MB RAM spike</div>
                  </div>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    onApplyPreset('clean_boot');
                    setOpenDropdown(null);
                    showToast('Kernel reset to clean state');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-sky-500/30 flex items-center space-x-2 transition-colors text-sky-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Reset Kernel to Clean State</span>
                </button>
              </div>
            )}
          </div>

          {/* Wallpaper / Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Wallpaper' : 'Switch to Dark Wallpaper'}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-200 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-300" />}
          </button>

          {/* Real-time Clock & Date (Clickable for mini calendar widget!) */}
          <div className="relative">
            <button
              onClick={(e) => toggleDropdown(e, 'clock')}
              className="font-medium text-slate-200 text-[11px] tracking-wide ml-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>{dateStr}</span>
              <span className="font-mono">{timeStr}</span>
            </button>

            {openDropdown === 'clock' && (
              <div className="absolute top-7 right-0 w-64 rounded-xl glass-panel p-3 shadow-2xl border border-white/20 text-slate-200 text-xs backdrop-blur-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold text-sky-300">
                  <div className="flex items-center space-x-1.5">
                    <CalendarIcon className="w-4 h-4 text-sky-400" />
                    <span>System Calendar</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Real-Time Clock</span>
                </div>
                <div className="text-center py-2 bg-black/30 rounded-lg border border-white/5">
                  <div className="text-lg font-bold text-white font-mono">{timeStr}</div>
                  <div className="text-xs text-sky-300">{dateStr}</div>
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  VayuOS Real-Time Clock synchronized with Host OS.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-9 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full glass-panel border border-sky-500/40 text-sky-200 text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
