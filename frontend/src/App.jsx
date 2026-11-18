import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Terminal as TerminalIcon,
  Folder,
  AlertTriangle,
  Code2,
  FileText,
  Calculator,
} from 'lucide-react';

import MenuBar from './components/MenuBar';
import Dock from './components/Dock';
import Window from './components/Window';
import AboutModal from './components/AboutModal';

import ActivityMonitor from './components/apps/ActivityMonitor';
import TerminalApp from './components/apps/TerminalApp';
import FinderApp from './components/apps/FinderApp';
import DeadlockLab from './components/apps/DeadlockLab';
import CodeStudio from './components/apps/CodeStudio';
import NotesApp from './components/apps/NotesApp';
import CalculatorApp from './components/apps/CalculatorApp';

import { kernelApi } from './api/kernelApi';

const APP_CONFIG = {
  activity: {
    id: 'activity',
    title: 'Activity Monitor',
    icon: Activity,
    defaultPosition: { x: 70, y: 50 },
    defaultSize: { width: 920, height: 580 },
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal — zsh',
    icon: TerminalIcon,
    defaultPosition: { x: 140, y: 90 },
    defaultSize: { width: 780, height: 480 },
  },
  finder: {
    id: 'finder',
    title: 'Finder',
    icon: Folder,
    defaultPosition: { x: 180, y: 70 },
    defaultSize: { width: 880, height: 540 },
  },
  deadlock: {
    id: 'deadlock',
    title: 'Deadlock Lab & Banker’s Safety',
    icon: AlertTriangle,
    defaultPosition: { x: 220, y: 60 },
    defaultSize: { width: 890, height: 570 },
  },
  code: {
    id: 'code',
    title: 'Code Studio (VS Code Style)',
    icon: Code2,
    defaultPosition: { x: 120, y: 55 },
    defaultSize: { width: 940, height: 600 },
  },
  notes: {
    id: 'notes',
    title: 'Notes',
    icon: FileText,
    defaultPosition: { x: 280, y: 120 },
    defaultSize: { width: 620, height: 440 },
  },
  calculator: {
    id: 'calculator',
    title: 'Calculator',
    icon: Calculator,
    defaultPosition: { x: 380, y: 140 },
    defaultSize: { width: 300, height: 400 },
  },
};

const INITIAL_KERNEL_STATE = {
  status: 'connecting',
  kernel_version: 'VayuOS 2.5 (macOS Sequoia Simulation)',
  uptime_sec: 0,
  auto_tick_enabled: true,
  tick_interval_sec: 1.0,
  cpu: {
    current_tick: 0,
    algorithm: 'RoundRobin',
    time_quantum: 3,
    running_pid: null,
    processes: [],
    gantt_history: [],
    active_processes_count: 0,
    cpu_utilization_percent: 0,
    average_waiting_time: 0,
    average_turnaround_time: 0,
  },
  memory: {
    total_ram_mb: 128,
    used_ram_mb: 0,
    free_ram_mb: 128,
    total_frames: 32,
    used_frames: 0,
    free_frames: 32,
    usage_percent: 0,
    replacement_policy: 'LRU',
    page_faults: 0,
    page_hits: 0,
    fault_rate_percent: 0,
    frames: Array.from({ length: 32 }, (_, i) => ({
      frame_id: i,
      is_allocated: false,
      pid: null,
      app_name: null,
      page_num: null,
      allocated_at_tick: 0,
      last_accessed_tick: 0,
      color: '#475569',
      size_mb: 4,
    })),
    swap_history: [],
  },
  filesystem: {
    total_blocks: 64,
    used_blocks: 1,
    free_blocks: 63,
    allocation_strategy: 'indexed',
    total_files: 4,
    total_directories: 5,
    blocks: Array.from({ length: 64 }, (_, i) => ({
      block_id: i,
      is_used: i === 0,
      file_name: i === 0 ? 'SUPERBLOCK' : null,
      block_type: i === 0 ? 'boot' : 'free',
      color: i === 0 ? '#475569' : '#1e293b',
    })),
    nodes: {},
  },
  deadlock: {
    total_resources: { Printer: 1, GPU: 1, 'Network Socket': 2, 'File Lock': 1 },
    available_resources: { Printer: 1, GPU: 1, 'Network Socket': 2, 'File Lock': 1 },
    allocations: {},
    requests: {},
    max_claims: {},
    is_deadlocked: false,
    cycle: [],
    cycle_edges: [],
    bankers_safety: { is_safe: true, safe_sequence: [], need: {} },
    graph_nodes: [],
    graph_edges: [],
  },
};

// Error Boundary to prevent any blank white screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('VayuOS Desktop Error Boundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-white/20 text-center space-y-4 shadow-2xl">
            <span className="text-4xl"></span>
            <h1 className="text-lg font-bold text-white">VayuOS Kernel Recovery</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              A UI component encountered an unexpected error. You can reload the Desktop
              Environment to restore full functionality.
            </p>
            <div className="p-3 bg-black/50 rounded-lg text-[11px] font-mono text-rose-300 text-left overflow-auto max-h-28 border border-white/10">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md"
            >
              Restart Desktop Environment
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <DesktopApp />
    </ErrorBoundary>
  );
}

function DesktopApp() {
  const [theme, setTheme] = useState('dark');
  const [isKernelOnline, setIsKernelOnline] = useState(false);
  const [kernelState, setKernelState] = useState(INITIAL_KERNEL_STATE);
  const [showAbout, setShowAbout] = useState(false);
  const [activeAppId, setActiveAppId] = useState('activity');
  const [topZIndex, setTopZIndex] = useState(10);

  // App Windows state
  const [windows, setWindows] = useState({
    activity: { isOpen: true, isMinimized: false, isMaximized: false, zIndex: 10, procPid: null },
    terminal: { isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9, procPid: null },
    finder: { isOpen: false, isMinimized: false, isMaximized: false, zIndex: 8, procPid: null },
    deadlock: { isOpen: false, isMinimized: false, isMaximized: false, zIndex: 7, procPid: null },
    code: { isOpen: false, isMinimized: false, isMaximized: false, zIndex: 6, procPid: null },
    notes: { isOpen: false, isMinimized: false, isMaximized: false, zIndex: 5, procPid: null },
    calculator: { isOpen: false, isMinimized: false, isMaximized: false, zIndex: 4, procPid: null },
  });

  // Fetch OS state from backend
  const fetchState = async () => {
    try {
      const state = await kernelApi.getState();
      setKernelState(state);
      setIsKernelOnline(true);
    } catch (err) {
      setIsKernelOnline(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  const bringToFront = (appId) => {
    const nextZ = topZIndex + 1;
    setTopZIndex(nextZ);
    setActiveAppId(appId);
    setWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        zIndex: nextZ,
        isMinimized: false,
      },
    }));
  };

  const handleOpenApp = async (appId) => {
    const current = windows[appId];
    if (current?.isOpen && !current?.isMinimized) {
      bringToFront(appId);
      return;
    }

    let spawnedPid = current?.procPid;

    // If Notes or Calculator, spawn corresponding process in backend
    if (!current?.isOpen && (appId === 'notes' || appId === 'calculator')) {
      try {
        const procName = appId === 'notes' ? 'Notes' : 'Calculator';
        const res = await kernelApi.runProcess(procName, 60, 3, 8, appId === 'notes' ? '#f59e0b' : '#f97316');
        if (res?.process?.pid) {
          spawnedPid = res.process.pid;
        }
      } catch (err) {
        console.error('Failed to spawn app process in backend:', err);
      }
    }

    const nextZ = topZIndex + 1;
    setTopZIndex(nextZ);
    setActiveAppId(appId);

    setWindows((prev) => ({
      ...prev,
      [appId]: {
        isOpen: true,
        isMinimized: false,
        isMaximized: current?.isMaximized || false,
        zIndex: nextZ,
        procPid: spawnedPid,
      },
    }));

    fetchState();
  };

  const handleCloseApp = async (appId) => {
    const procPid = windows[appId]?.procPid;
    if (procPid) {
      try {
        await kernelApi.killProcess(procPid);
      } catch (err) {
        console.error('Error killing process on close:', err);
      }
    }

    setWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isOpen: false,
        isMinimized: false,
        procPid: null,
      },
    }));

    fetchState();
  };

  const handleMinimizeApp = (appId) => {
    setWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isMinimized: true,
      },
    }));
  };

  const handleMaximizeApp = (appId) => {
    setWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isMaximized: !prev[appId].isMaximized,
      },
    }));
  };

  const handleApplyPreset = async (presetName) => {
    try {
      await kernelApi.applyPreset(presetName);
      fetchState();
    } catch (err) {
      console.error('Failed to apply preset:', err);
    }
  };

  const handleCloseActiveApp = () => {
    if (activeAppId) {
      handleCloseApp(activeAppId);
    }
  };

  const activeAppTitle = APP_CONFIG[activeAppId]?.title || 'Desktop';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-500 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
      }`}
    >
      {/* Dynamic macOS Mesh Gradient Wallpaper */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          theme === 'dark'
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(at 15% 15%, #3b0764 0px, transparent 50%), radial-gradient(at 85% 20%, #1e1b4b 0px, transparent 50%), radial-gradient(at 50% 50%, #0369a1 0px, transparent 50%), radial-gradient(at 80% 80%, #4c0519 0px, transparent 50%), radial-gradient(at 20% 85%, #0f172a 0px, transparent 50%)',
          backgroundColor: '#090d16',
        }}
      />

      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          theme === 'light'
            ? 'opacity-100'
            : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(at 10% 20%, #bfdbfe 0px, transparent 50%), radial-gradient(at 80% 15%, #fed7aa 0px, transparent 50%), radial-gradient(at 50% 60%, #e9d5ff 0px, transparent 50%), radial-gradient(at 20% 80%, #fbcfe8 0px, transparent 50%)',
          backgroundColor: '#f1f5f9',
        }}
      />

      {/* Top Menu Bar */}
      <MenuBar
        activeAppTitle={activeAppTitle}
        activeAppId={activeAppId}
        kernelState={kernelState}
        isKernelOnline={isKernelOnline}
        onApplyPreset={handleApplyPreset}
        onOpenAbout={() => setShowAbout(true)}
        onOpenApp={handleOpenApp}
        onCloseActiveApp={handleCloseActiveApp}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onRefresh={fetchState}
      />

      {/* Desktop Workspace & Floating Windows */}
      <main className="absolute inset-0 pt-7 pb-20 overflow-hidden">
        {/* Activity Monitor Window */}
        <Window
          id="activity"
          title={APP_CONFIG.activity.title}
          icon={APP_CONFIG.activity.icon}
          isOpen={windows.activity.isOpen}
          isMinimized={windows.activity.isMinimized}
          isMaximized={windows.activity.isMaximized}
          zIndex={windows.activity.zIndex}
          defaultPosition={APP_CONFIG.activity.defaultPosition}
          defaultSize={APP_CONFIG.activity.defaultSize}
          onClose={() => handleCloseApp('activity')}
          onMinimize={() => handleMinimizeApp('activity')}
          onMaximize={() => handleMaximizeApp('activity')}
          onFocus={() => bringToFront('activity')}
        >
          <ActivityMonitor kernelState={kernelState} onRefresh={fetchState} />
        </Window>

        {/* Terminal Window */}
        <Window
          id="terminal"
          title={APP_CONFIG.terminal.title}
          icon={APP_CONFIG.terminal.icon}
          isOpen={windows.terminal.isOpen}
          isMinimized={windows.terminal.isMinimized}
          isMaximized={windows.terminal.isMaximized}
          zIndex={windows.terminal.zIndex}
          defaultPosition={APP_CONFIG.terminal.defaultPosition}
          defaultSize={APP_CONFIG.terminal.defaultSize}
          onClose={() => handleCloseApp('terminal')}
          onMinimize={() => handleMinimizeApp('terminal')}
          onMaximize={() => handleMaximizeApp('terminal')}
          onFocus={() => bringToFront('terminal')}
        >
          <TerminalApp onRefresh={fetchState} />
        </Window>

        {/* Finder Window */}
        <Window
          id="finder"
          title={APP_CONFIG.finder.title}
          icon={APP_CONFIG.finder.icon}
          isOpen={windows.finder.isOpen}
          isMinimized={windows.finder.isMinimized}
          isMaximized={windows.finder.isMaximized}
          zIndex={windows.finder.zIndex}
          defaultPosition={APP_CONFIG.finder.defaultPosition}
          defaultSize={APP_CONFIG.finder.defaultSize}
          onClose={() => handleCloseApp('finder')}
          onMinimize={() => handleMinimizeApp('finder')}
          onMaximize={() => handleMaximizeApp('finder')}
          onFocus={() => bringToFront('finder')}
        >
          <FinderApp kernelState={kernelState} onRefresh={fetchState} />
        </Window>

        {/* Deadlock Lab Window */}
        <Window
          id="deadlock"
          title={APP_CONFIG.deadlock.title}
          icon={APP_CONFIG.deadlock.icon}
          isOpen={windows.deadlock.isOpen}
          isMinimized={windows.deadlock.isMinimized}
          isMaximized={windows.deadlock.isMaximized}
          zIndex={windows.deadlock.zIndex}
          defaultPosition={APP_CONFIG.deadlock.defaultPosition}
          defaultSize={APP_CONFIG.deadlock.defaultSize}
          onClose={() => handleCloseApp('deadlock')}
          onMinimize={() => handleMinimizeApp('deadlock')}
          onMaximize={() => handleMaximizeApp('deadlock')}
          onFocus={() => bringToFront('deadlock')}
        >
          <DeadlockLab kernelState={kernelState} onRefresh={fetchState} />
        </Window>

        {/* Code Studio Window */}
        <Window
          id="code"
          title={APP_CONFIG.code.title}
          icon={APP_CONFIG.code.icon}
          isOpen={windows.code.isOpen}
          isMinimized={windows.code.isMinimized}
          isMaximized={windows.code.isMaximized}
          zIndex={windows.code.zIndex}
          defaultPosition={APP_CONFIG.code.defaultPosition}
          defaultSize={APP_CONFIG.code.defaultSize}
          onClose={() => handleCloseApp('code')}
          onMinimize={() => handleMinimizeApp('code')}
          onMaximize={() => handleMaximizeApp('code')}
          onFocus={() => bringToFront('code')}
        >
          <CodeStudio onRefresh={fetchState} />
        </Window>

        {/* Notes Window */}
        <Window
          id="notes"
          title={APP_CONFIG.notes.title}
          icon={APP_CONFIG.notes.icon}
          isOpen={windows.notes.isOpen}
          isMinimized={windows.notes.isMinimized}
          isMaximized={windows.notes.isMaximized}
          zIndex={windows.notes.zIndex}
          defaultPosition={APP_CONFIG.notes.defaultPosition}
          defaultSize={APP_CONFIG.notes.defaultSize}
          onClose={() => handleCloseApp('notes')}
          onMinimize={() => handleMinimizeApp('notes')}
          onMaximize={() => handleMaximizeApp('notes')}
          onFocus={() => bringToFront('notes')}
        >
          <NotesApp onRefresh={fetchState} />
        </Window>

        {/* Calculator Window */}
        <Window
          id="calculator"
          title={APP_CONFIG.calculator.title}
          icon={APP_CONFIG.calculator.icon}
          isOpen={windows.calculator.isOpen}
          isMinimized={windows.calculator.isMinimized}
          isMaximized={windows.calculator.isMaximized}
          zIndex={windows.calculator.zIndex}
          defaultPosition={APP_CONFIG.calculator.defaultPosition}
          defaultSize={APP_CONFIG.calculator.defaultSize}
          onClose={() => handleCloseApp('calculator')}
          onMinimize={() => handleMinimizeApp('calculator')}
          onMaximize={() => handleMaximizeApp('calculator')}
          onFocus={() => bringToFront('calculator')}
        >
          <CalculatorApp />
        </Window>
      </main>

      {/* Bottom Floating Glassmorphic Dock */}
      <Dock openApps={windows} onOpenApp={handleOpenApp} />

      {/* About & Viva Guide Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
