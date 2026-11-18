import React, { useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

export default function Window({
  id,
  title,
  icon: Icon,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  defaultPosition = { x: 80, y: 50 },
  defaultSize = { width: 850, height: 560 },
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children,
}) {
  const dragControls = useDragControls();

  if (!isOpen) return null;

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.02}
      onPointerDown={onFocus}
      initial={{
        scale: 0.94,
        opacity: 0,
        x: defaultPosition.x,
        y: defaultPosition.y,
      }}
      animate={{
        scale: 1,
        opacity: 1,
        ...(isMaximized
          ? { x: 0, y: 28, width: '100vw', height: 'calc(100vh - 92px)' }
          : { width: defaultSize.width, height: defaultSize.height }),
      }}
      exit={{ scale: 0.88, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      style={{
        zIndex,
        position: 'absolute',
        display: isMinimized ? 'none' : 'flex',
      }}
      className={`flex flex-col rounded-2xl overflow-hidden glass-panel text-slate-100 select-none shadow-2xl backdrop-blur-2xl transition-[border-radius,box-shadow] duration-150 ${
        isMaximized
          ? 'rounded-none border-x-0 border-t-0 shadow-none'
          : 'border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
      }`}
    >
      {/* VayuOS Titlebar: Only this triggers window dragging */}
      <div
        onPointerDown={(e) => {
          onFocus();
          if (!isMaximized) {
            dragControls.start(e);
          }
        }}
        onDoubleClick={onMaximize}
        className="h-10 px-3.5 flex items-center justify-between bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.08] border-b border-white/10 cursor-grab active:cursor-grabbing backdrop-blur-xl shrink-0"
      >
        {/* Original VayuOS Luminous Window Control Capsule */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 shadow-inner cursor-default"
        >
          {/* 1. Close Button (Ruby Octagon / Faceted Ring) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close / Terminate Process"
            className="group relative w-4 h-4 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center transition-all hover:scale-115 hover:shadow-[0_0_10px_rgba(244,63,94,0.7)] cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:hidden transition-all" />
            <X className="w-2.5 h-2.5 text-white stroke-[2.5] hidden group-hover:block transition-all" />
          </button>

          {/* 2. Minimize Button (Amber Topaz Slit) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimize to Dock"
            className="group relative w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center transition-all hover:scale-115 hover:shadow-[0_0_10px_rgba(245,158,11,0.7)] cursor-pointer"
          >
            <span className="w-2 h-0.5 rounded-full bg-white/60 group-hover:hidden transition-all" />
            <Minus className="w-2.5 h-2.5 text-slate-950 stroke-[3] hidden group-hover:block transition-all" />
          </button>

          {/* 3. Maximize / Restore Button (Cyan/Emerald Rhombus) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            title={isMaximized ? 'Restore Window Size' : 'Expand Full Workspace'}
            className="group relative w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center transition-all hover:scale-115 hover:shadow-[0_0_10px_rgba(6,182,212,0.7)] cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rotate-45 bg-white/50 group-hover:hidden transition-all" />
            {isMaximized ? (
              <Minimize2 className="w-2.5 h-2.5 text-slate-950 stroke-[2.5] hidden group-hover:block transition-all" />
            ) : (
              <Maximize2 className="w-2.5 h-2.5 text-slate-950 stroke-[2.5] hidden group-hover:block transition-all" />
            )}
          </button>
        </div>

        {/* Window Title & Icon */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 tracking-wide pointer-events-none drop-shadow-sm">
          {Icon && <Icon className="w-4 h-4 text-sky-400" />}
          <span>{title}</span>
        </div>

        {/* Right Status Badge / Pill */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>VayuOS</span>
          </span>
        </div>
      </div>

      {/* Window Body: Completely isolated from drag events */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 overflow-auto bg-slate-950/70 p-0 text-slate-200 flex flex-col"
      >
        {children}
      </div>
    </motion.div>
  );
}
