import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { kernelApi } from '../../api/kernelApi';

export default function TerminalApp({ onRefresh }) {
  const [history, setHistory] = useState([
    {
      type: 'system',
      text: 'Last login: ' + new Date().toLocaleString() + ' on ttys001\nWelcome to VayuOS Simulated macOS Terminal (Zsh).\nType "help" for a list of available Operating System commands.\n',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = async (e) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Add to input history
    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);

    // Add command echo to history
    const newHist = [...history, { type: 'command', text: cmd }];
    setInputVal('');

    if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      return;
    }

    try {
      const res = await kernelApi.runTerminalCommand(cmd);
      if (res.output === '__CLEAR__') {
        setHistory([]);
      } else {
        newHist.push({ type: 'output', text: res.output });
        setHistory(newHist);
      }
      onRefresh();
    } catch (err) {
      newHist.push({
        type: 'error',
        text: `zsh: execution failed: ${err.message}`,
      });
      setHistory(newHist);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setHistory((prev) => [...prev, { type: 'command', text: inputVal + '^C' }]);
      setInputVal('');
      return;
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setHistory([]);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= cmdHistory.length) {
          setHistoryIdx(-1);
          setInputVal('');
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(cmdHistory[nextIdx]);
        }
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="h-full flex flex-col bg-slate-950/95 font-mono text-xs text-slate-100 p-4 overflow-y-auto select-text cursor-text"
    >
      {/* Terminal History */}
      <div className="space-y-2 flex-1">
        {history.map((h, i) => {
          if (h.type === 'system') {
            return (
              <div key={i} className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                {h.text}
              </div>
            );
          }
          if (h.type === 'command') {
            return (
              <div key={i} className="flex items-center space-x-2 text-slate-200">
                <span className="text-emerald-400 font-bold">guest@vayu-macbook</span>
                <span className="text-sky-400">~ %</span>
                <span className="text-white font-medium">{h.text}</span>
              </div>
            );
          }
          if (h.type === 'error') {
            return (
              <div key={i} className="text-rose-400 whitespace-pre-wrap">
                {h.text}
              </div>
            );
          }
          return (
            <div key={i} className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {h.text}
            </div>
          );
        })}

        {/* Current Prompt Input */}
        <form onSubmit={handleCommand} className="flex items-center space-x-2 pt-1">
          <span className="text-emerald-400 font-bold shrink-0">guest@vayu-macbook</span>
          <span className="text-sky-400 shrink-0">~ %</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white font-mono caret-sky-400"
          />
        </form>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
