/**
 * API client for communicating with the Python FastAPI Kernel Backend
 */

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// When deployed on cloud, use relative path (''); on local dev use Vite proxy or direct port
const API_BASE = isLocalhost ? (window.location.port === '5173' ? '' : 'http://127.0.0.1:8000') : '';

async function fetchJson(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (err) {
    // Fallback to relative Vite dev server proxy
    response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  }

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorMsg = errData.detail;
      }
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const kernelApi = {
  // System State & Info
  getState: () => fetchJson('/api/state'),
  getSystemInfo: () => fetchJson('/api/system/info'),

  // CPU Scheduler
  stepCpu: () => fetchJson('/api/cpu/step', { method: 'POST' }),
  setAlgorithm: (algorithm, time_quantum = 3) =>
    fetchJson('/api/cpu/algorithm', {
      method: 'POST',
      body: JSON.stringify({ algorithm, time_quantum }),
    }),
  setAutoTick: (enabled, interval_sec = 1.0) =>
    fetchJson('/api/cpu/auto-tick', {
      method: 'POST',
      body: JSON.stringify({ enabled, interval_sec }),
    }),

  // Processes
  runProcess: (name, burst_time, priority = 3, ram_mb = 8, color = null) =>
    fetchJson('/api/process/run', {
      method: 'POST',
      body: JSON.stringify({ name, burst_time, priority, ram_mb, color }),
    }),
  killProcess: (pid) =>
    fetchJson(`/api/process/kill/${pid}`, { method: 'POST' }),
  clearTerminatedProcesses: () =>
    fetchJson('/api/process/clear-terminated', { method: 'POST' }),

  // Virtual Memory & Paging
  setMemoryPolicy: (policy) =>
    fetchJson('/api/memory/replace', {
      method: 'POST',
      body: JSON.stringify({ policy }),
    }),
  flushMemory: () =>
    fetchJson('/api/memory/flush', { method: 'POST' }),

  // Virtual File System
  getFilesTree: () => fetchJson('/api/files/tree'),
  listFiles: (dir = '/Users/guest') =>
    fetchJson(`/api/files/ls?dir=${encodeURIComponent(dir)}`),
  readFile: (path) =>
    fetchJson(`/api/files/cat?path=${encodeURIComponent(path)}`),
  writeFile: (path, content) =>
    fetchJson('/api/files/write', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    }),
  createFolder: (path) =>
    fetchJson('/api/files/mkdir', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  createFile: (path, content = '') =>
    fetchJson('/api/files/touch', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    }),
  deleteFile: (path) =>
    fetchJson('/api/files/rm', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  setAllocationStrategy: (strategy) =>
    fetchJson('/api/files/strategy', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    }),
  runTerminalCommand: (command) =>
    fetchJson('/api/files/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    }),

  // Deadlock Manager
  getDeadlockState: () => fetchJson('/api/deadlock/state'),
  requestResource: (process_name, resource_name, amount = 1) =>
    fetchJson('/api/deadlock/request', {
      method: 'POST',
      body: JSON.stringify({ process_name, resource_name, amount }),
    }),
  releaseResource: (process_name, resource_name, amount = 1) =>
    fetchJson('/api/deadlock/release', {
      method: 'POST',
      body: JSON.stringify({ process_name, resource_name, amount }),
    }),
  triggerDeadlockPreset: () =>
    fetchJson('/api/deadlock/trigger-deadlock', { method: 'POST' }),
  autoRecoverDeadlock: () =>
    fetchJson('/api/deadlock/auto-recover', { method: 'POST' }),
  terminateDeadlockProcess: (process_name) =>
    fetchJson('/api/deadlock/terminate', {
      method: 'POST',
      body: JSON.stringify({ process_name }),
    }),

  // 1-Click Viva Demo Presets
  applyPreset: (preset_name) =>
    fetchJson('/api/demo/preset', {
      method: 'POST',
      body: JSON.stringify({ preset_name }),
    }),

  // Safe Code Runner
  executeCode: (code, filename = 'script.py') =>
    fetchJson('/api/code/execute', {
      method: 'POST',
      body: JSON.stringify({ code, filename }),
    }),
};
