import React, { useState, useEffect } from 'react';
import { Delete, RotateCcw } from 'lucide-react';

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(parseInt(e.key, 10));
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+' || e.key === '-') {
        handleOp(e.key);
      } else if (e.key === '*') {
        handleOp('×');
      } else if (e.key === '/') {
        handleOp('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Backspace') {
        setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, prevValue, operation, waitingForOperand]);

  const handleDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleOp = (op) => {
    const currentVal = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(currentVal);
    } else if (operation) {
      const result = compute(prevValue, currentVal, operation);
      setDisplay(String(result));
      setPrevValue(result);
    }

    setWaitingForOperand(true);
    setOperation(op);
  };

  const compute = (a, b, op) => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 'Error';
      default:
        return b;
    }
  };

  const handleEquals = () => {
    if (operation === null || prevValue === null) return;
    const currentVal = parseFloat(display);
    const result = compute(prevValue, currentVal, operation);
    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };

  const handleToggleSign = () => {
    const val = parseFloat(display);
    setDisplay(String(-val));
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900/90 text-white select-none p-3 justify-between">
      {/* Display Screen */}
      <div className="h-16 px-4 flex items-end justify-end bg-black/40 rounded-xl border border-white/10 text-3xl font-light tracking-wider overflow-hidden">
        {display}
      </div>

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-2 mt-3 text-sm font-medium">
        <button
          onClick={handleClear}
          className="h-11 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-amber-300 font-semibold transition-colors cursor-pointer"
        >
          AC
        </button>
        <button
          onClick={handleToggleSign}
          className="h-11 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
        >
          ±
        </button>
        <button
          onClick={handlePercent}
          className="h-11 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
        >
          %
        </button>
        <button
          onClick={() => handleOp('÷')}
          className={`h-11 rounded-lg font-bold text-lg transition-colors cursor-pointer ${
            operation === '÷' ? 'bg-white text-orange-500' : 'bg-orange-500 hover:bg-orange-400 text-white'
          }`}
        >
          ÷
        </button>

        <button
          onClick={() => handleDigit(7)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          7
        </button>
        <button
          onClick={() => handleDigit(8)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          8
        </button>
        <button
          onClick={() => handleDigit(9)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          9
        </button>
        <button
          onClick={() => handleOp('×')}
          className={`h-11 rounded-lg font-bold text-lg transition-colors cursor-pointer ${
            operation === '×' ? 'bg-white text-orange-500' : 'bg-orange-500 hover:bg-orange-400 text-white'
          }`}
        >
          ×
        </button>

        <button
          onClick={() => handleDigit(4)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          4
        </button>
        <button
          onClick={() => handleDigit(5)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          5
        </button>
        <button
          onClick={() => handleDigit(6)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          6
        </button>
        <button
          onClick={() => handleOp('-')}
          className={`h-11 rounded-lg font-bold text-lg transition-colors cursor-pointer ${
            operation === '-' ? 'bg-white text-orange-500' : 'bg-orange-500 hover:bg-orange-400 text-white'
          }`}
        >
          -
        </button>

        <button
          onClick={() => handleDigit(1)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          1
        </button>
        <button
          onClick={() => handleDigit(2)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          2
        </button>
        <button
          onClick={() => handleDigit(3)}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          3
        </button>
        <button
          onClick={() => handleOp('+')}
          className={`h-11 rounded-lg font-bold text-lg transition-colors cursor-pointer ${
            operation === '+' ? 'bg-white text-orange-500' : 'bg-orange-500 hover:bg-orange-400 text-white'
          }`}
        >
          +
        </button>

        <button
          onClick={() => handleDigit(0)}
          className="col-span-2 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="h-11 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg transition-colors cursor-pointer shadow-md"
        >
          =
        </button>
      </div>
    </div>
  );
}
