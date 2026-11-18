import React, { useState, useEffect } from 'react';
import { FileText, Save, Check, RefreshCw } from 'lucide-react';
import { kernelApi } from '../../api/kernelApi';

export default function NotesApp({ onRefresh }) {
  const [noteContent, setNoteContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const loadNotes = async () => {
    try {
      const res = await kernelApi.readFile('/Users/guest/notes.txt');
      setNoteContent(res.content || '');
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSave = async () => {
    try {
      await kernelApi.writeFile('/Users/guest/notes.txt', noteContent);
      setIsSaved(true);
      setSaveStatus('Saved to virtual_disk.json');
      setTimeout(() => setSaveStatus(''), 2500);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="h-full flex flex-col bg-slate-950/85 text-slate-100 select-text"
    >
      {/* Toolbar */}
      <div className="h-10 px-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">Viva Quick Notes (/Users/guest/notes.txt)</span>
          {!isSaved && <span className="w-2 h-2 rounded-full bg-amber-400" />}
        </div>
        <div className="flex items-center space-x-2">
          {saveStatus && (
            <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>{saveStatus}</span>
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-4">
        <textarea
          value={noteContent}
          onChange={(e) => {
            setNoteContent(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Type your OS viva notes here..."
          className="w-full h-full p-4 rounded-xl bg-slate-900/60 border border-white/10 text-slate-100 font-sans text-sm outline-none resize-none leading-relaxed placeholder:text-slate-600 focus:border-amber-500/50"
        />
      </div>
    </div>
  );
}
