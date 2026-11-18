import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Folder,
  Terminal,
  Activity,
  AlertTriangle,
  Code2,
  FileText,
  Calculator,
} from 'lucide-react';

const APPS = [
  {
    id: 'finder',
    title: 'Finder',
    icon: Folder,
    color: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/30',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    icon: Terminal,
    color: 'from-slate-700 to-slate-900',
    shadow: 'shadow-slate-600/30',
  },
  {
    id: 'activity',
    title: 'Activity Monitor',
    icon: Activity,
    color: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/30',
  },
  {
    id: 'deadlock',
    title: 'Deadlock Lab',
    icon: AlertTriangle,
    color: 'from-rose-500 to-amber-500',
    shadow: 'shadow-rose-500/30',
  },
  {
    id: 'code',
    title: 'Code Studio',
    icon: Code2,
    color: 'from-indigo-500 to-purple-600',
    shadow: 'shadow-indigo-500/30',
  },
  {
    id: 'notes',
    title: 'Notes',
    icon: FileText,
    color: 'from-amber-400 to-yellow-500',
    shadow: 'shadow-amber-400/30',
  },
  {
    id: 'calculator',
    title: 'Calculator',
    icon: Calculator,
    color: 'from-orange-500 to-red-500',
    shadow: 'shadow-orange-500/30',
  },
];

function DockItem({ app, mouseX, openApps, onOpenApp }) {
  const ref = useRef(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // macOS dock magnification formula
  const widthSync = useTransform(distance, [-120, 0, 120], [48, 68, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 14 });

  const isOpen = openApps[app.id]?.isOpen;
  const isMinimized = openApps[app.id]?.isMinimized;
  const Icon = app.icon;

  return (
    <div className="flex flex-col items-center">
      <motion.button
        ref={ref}
        style={{ width, height: width }}
        whileTap={{ scale: 0.88, y: 5 }}
        onClick={() => onOpenApp(app.id)}
        className={`relative group rounded-2xl flex items-center justify-center bg-gradient-to-tr ${app.color} shadow-lg ${app.shadow} border border-white/25 transition-shadow hover:shadow-xl cursor-pointer`}
      >
        <Icon className="w-6 h-6 text-white drop-shadow-md" />

        {/* macOS Tooltip */}
        <span className="absolute -top-9 px-2.5 py-1 rounded-lg glass-panel text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/20">
          {app.title}
        </span>
      </motion.button>

      {/* Active App Dot Indicator */}
      <div className="h-1.5 flex items-center justify-center mt-1">
        {isOpen && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMinimized ? 'bg-slate-400/60' : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
            }`}
          />
        )}
      </div>
    </div>
  );
}

export default function Dock({ openApps, onOpenApp }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="glass-dock rounded-3xl px-3.5 pt-2 pb-1 flex items-end space-x-3 pointer-events-auto border border-white/20 shadow-2xl backdrop-blur-2xl"
      >
        {APPS.map((app) => (
          <DockItem
            key={app.id}
            app={app}
            mouseX={mouseX}
            openApps={openApps}
            onOpenApp={onOpenApp}
          />
        ))}
      </motion.div>
    </div>
  );
}
