import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  HardDrive,
  Grid,
  List as ListIcon,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  Database,
  Layers,
  ArrowRight,
  FilePlus,
  FolderPlus,
  Save,
  X,
} from 'lucide-react';
import { kernelApi } from '../../api/kernelApi';

export default function FinderApp({ kernelState, onRefresh }) {
  const [currentPath, setCurrentPath] = useState('/Users/guest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' or 'diskmap'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [files, setFiles] = useState([]);
  const [diskState, setDiskState] = useState(null);

  // File Editor Modal
  const [editorFile, setEditorFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');

  // Modals for Create
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadDirectory = async (path) => {
    try {
      const res = await kernelApi.listFiles(path);
      setFiles(res.files || []);
      setCurrentPath(path);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDiskMap = async () => {
    try {
      const res = await kernelApi.getFilesTree();
      setDiskState(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
    loadDiskMap();
  }, [currentPath, kernelState?.filesystem?.used_blocks, kernelState?.filesystem?.total_files]);

  const handleOpenFolder = (folderPath) => {
    loadDirectory(folderPath);
  };

  const handleOpenFile = async (item) => {
    try {
      const res = await kernelApi.readFile(item.path);
      setEditorFile(item);
      setEditorContent(res.content || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditor = async () => {
    if (!editorFile) return;
    try {
      await kernelApi.writeFile(editorFile.path, editorContent);
      setEditorFile(null);
      loadDirectory(currentPath);
      loadDiskMap();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName) return;
    const fullPath = `${currentPath.replace(/\/$/, '')}/${newFileName}`;
    try {
      await kernelApi.createFile(fullPath, '# New File in VayuOS\n');
      setShowNewFileModal(false);
      setNewFileName('');
      loadDirectory(currentPath);
      loadDiskMap();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName) return;
    const fullPath = `${currentPath.replace(/\/$/, '')}/${newFolderName}`;
    try {
      await kernelApi.createFolder(fullPath);
      setShowNewFolderModal(false);
      setNewFolderName('');
      loadDirectory(currentPath);
      loadDiskMap();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await kernelApi.deleteFile(selectedItem.path);
      setSelectedItem(null);
      loadDirectory(currentPath);
      loadDiskMap();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStrategyChange = async (strat) => {
    try {
      await kernelApi.setAllocationStrategy(strat);
      loadDiskMap();
      loadDirectory(currentPath);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);
  const blocks = diskState?.blocks || [];

  return (
    <div className="flex h-full bg-slate-950/80 text-slate-100 select-none">
      {/* Left Sidebar (macOS Favorites & Storage) */}
      <div className="w-52 border-r border-white/10 bg-white/[0.02] p-3 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 mb-1.5">
              Favorites
            </div>
            <div className="space-y-0.5">
              {[
                { name: 'Home', path: '/Users/guest', icon: Folder },
                { name: 'Documents', path: '/Users/guest/Documents', icon: Folder },
                { name: 'Applications', path: '/Applications', icon: Folder },
                { name: 'System', path: '/System', icon: Folder },
                { name: 'Root (/)', path: '/', icon: HardDrive },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setActiveTab('explorer');
                    handleOpenFolder(item.path);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    currentPath === item.path && activeTab === 'explorer'
                      ? 'bg-sky-500/20 text-sky-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 mb-1.5">
              Storage Views
            </div>
            <button
              onClick={() => setActiveTab('diskmap')}
              className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                activeTab === 'diskmap'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>64-Block Disk Map</span>
            </button>
          </div>
        </div>

        {/* Disk Usage Widget */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-200">Virtual Disk</span>
            <span className="text-slate-400">
              {diskState?.used_blocks || 0}/64 blks
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all"
              style={{
                width: `${Math.round(((diskState?.used_blocks || 0) / 64) * 100)}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-slate-400">
            Persisted in <code>virtual_disk.json</code>
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Finder Toolbar */}
        <div className="h-12 px-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center space-x-1 text-slate-300">
            <button
              onClick={() => handleOpenFolder('/')}
              className="hover:text-white transition-colors"
            >
              /
            </button>
            {breadcrumbs.map((crumb, idx) => {
              const crumbPath = '/' + breadcrumbs.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={crumbPath}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <button
                    onClick={() => handleOpenFolder(crumbPath)}
                    className={`hover:text-white transition-colors ${
                      idx === breadcrumbs.length - 1 ? 'text-sky-400 font-semibold' : ''
                    }`}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            {activeTab === 'explorer' ? (
              <>
                <button
                  onClick={() => setShowNewFileModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center space-x-1 cursor-pointer"
                  title="New File (touch)"
                >
                  <FilePlus className="w-3.5 h-3.5 text-sky-400" />
                  <span>New File</span>
                </button>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center space-x-1 cursor-pointer"
                  title="New Folder (mkdir)"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Folder</span>
                </button>
                {selectedItem && (
                  <button
                    onClick={handleDelete}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                    title="Delete (rm)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                  title="Toggle Grid / List view"
                >
                  {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </button>
              </>
            ) : (
              /* Strategy switchers in Disk Map */
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[11px] mr-1">Allocation Strategy:</span>
                {['contiguous', 'linked', 'indexed'].map((strat) => (
                  <button
                    key={strat}
                    onClick={() => handleStrategyChange(strat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                      diskState?.allocation_strategy === strat
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {strat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Switch: Explorer or Disk Map */}
        {activeTab === 'explorer' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Files Grid / List */}
            <div className="flex-1 overflow-y-auto p-4">
              {files.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  This folder is empty.
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {files.map((file) => {
                    const isDir = file.type === 'directory';
                    const isSelected = selectedItem?.path === file.path;
                    return (
                      <div
                        key={file.path}
                        onClick={() => setSelectedItem(file)}
                        onDoubleClick={() =>
                          isDir ? handleOpenFolder(file.path) : handleOpenFile(file)
                        }
                        className={`p-3 rounded-xl flex flex-col items-center text-center transition-all cursor-pointer select-none border ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-500/40 text-white shadow-lg'
                            : 'border-transparent hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        {isDir ? (
                          <Folder className="w-10 h-10 text-sky-400 mb-1.5" />
                        ) : file.name.endsWith('.py') ? (
                          <FileCode className="w-10 h-10 text-emerald-400 mb-1.5" />
                        ) : (
                          <FileText className="w-10 h-10 text-slate-300 mb-1.5" />
                        )}
                        <span className="text-xs font-medium truncate max-w-full">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isDir ? 'Folder' : `${file.size}B`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Permissions</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Allocated Blocks</th>
                      <th className="px-3 py-2">Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {files.map((file) => {
                      const isDir = file.type === 'directory';
                      const isSelected = selectedItem?.path === file.path;
                      return (
                        <tr
                          key={file.path}
                          onClick={() => setSelectedItem(file)}
                          onDoubleClick={() =>
                            isDir ? handleOpenFolder(file.path) : handleOpenFile(file)
                          }
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-500/15' : ''
                          }`}
                        >
                          <td className="px-3 py-2 flex items-center space-x-2 font-medium text-white">
                            {isDir ? (
                              <Folder className="w-4 h-4 text-sky-400" />
                            ) : file.name.endsWith('.py') ? (
                              <FileCode className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{file.name}</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-400">
                            {file.permissions}
                          </td>
                          <td className="px-3 py-2 text-slate-300">
                            {isDir ? '-' : `${file.size} B`}
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-400">
                            {file.blocks && file.blocks.length > 0
                              ? `[${file.blocks.join(', ')}]`
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-400 text-[11px]">
                            {file.modified_at}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Right Inspector Sidebar */}
            {selectedItem && (
              <div className="w-60 border-l border-white/10 bg-white/[0.02] p-4 text-xs space-y-3 overflow-y-auto">
                <div className="flex flex-col items-center text-center pb-2 border-b border-white/10">
                  {selectedItem.type === 'directory' ? (
                    <Folder className="w-12 h-12 text-sky-400 mb-2" />
                  ) : (
                    <FileText className="w-12 h-12 text-slate-300 mb-2" />
                  )}
                  <div className="font-bold text-white text-sm truncate max-w-full">
                    {selectedItem.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{selectedItem.path}</div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Permissions:</span>
                    <span className="font-mono text-white bg-black/30 px-1.5 py-0.5 rounded">
                      {selectedItem.permissions}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Size:</span>
                    <span className="text-white">
                      {selectedItem.type === 'directory' ? 'Directory' : `${selectedItem.size} Bytes`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Disk Allocation Strategy:</span>
                    <span className="text-purple-300 font-semibold capitalize">
                      {selectedItem.allocation_strategy || diskState?.allocation_strategy}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Allocated Disk Blocks:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.blocks && selectedItem.blocks.length > 0 ? (
                        selectedItem.blocks.map((b) => (
                          <span
                            key={b}
                            className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]"
                          >
                            B{b}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                  {selectedItem.index_block !== null && selectedItem.index_block !== undefined && (
                    <div>
                      <span className="text-slate-400 block">Index Block:</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                        B{selectedItem.index_block}
                      </span>
                    </div>
                  )}
                </div>

                {selectedItem.type === 'file' && (
                  <button
                    onClick={() => handleOpenFile(selectedItem)}
                    className="w-full py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Open in Editor</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 64-BLOCK DISK ALLOCATION MAP VIEW */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-purple-300">
                  Virtual Disk 64-Block Map (CO4 Disk Allocation):
                </span>
                <span className="text-slate-300 ml-2">
                  Showing <strong>{(diskState?.allocation_strategy || 'indexed').toUpperCase()}</strong> strategy.
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-600" />
                  <span>Boot/Superblock</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                  <span>Index Block</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-sky-500" />
                  <span>Data Block</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800" />
                  <span>Free</span>
                </span>
              </div>
            </div>

            {/* 64 Blocks Grid */}
            <div className="grid grid-cols-8 gap-2 p-3 rounded-xl bg-slate-900/90 border border-white/10">
              {blocks.map((block) => {
                const isBoot = block.block_type === 'boot';
                const isIndex = block.block_type === 'index';
                const isData = block.block_type === 'data';
                const isUsed = block.is_used;

                return (
                  <div
                    key={block.block_id}
                    onClick={() => setSelectedBlock(block)}
                    title={`Block #${block.block_id} | Type: ${block.block_type} | Owner: ${block.file_name || 'None'}`}
                    style={{
                      backgroundColor: isBoot
                        ? '#475569'
                        : isIndex
                        ? '#6366f1'
                        : isData
                        ? block.color || '#0284c7'
                        : '#1e293b',
                    }}
                    className={`h-16 rounded-xl p-1.5 flex flex-col justify-between text-left border transition-all hover:scale-105 cursor-pointer shadow-sm select-none ${
                      selectedBlock?.block_id === block.block_id
                        ? 'border-white ring-2 ring-purple-400 shadow-lg'
                        : 'border-white/10'
                    } ${isUsed ? 'shadow-md' : 'opacity-60'}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
                      <span>B{block.block_id}</span>
                      <span className="text-[8px] bg-black/40 px-1 rounded uppercase">
                        {block.block_type}
                      </span>
                    </div>
                    <div className="truncate text-[10px] font-semibold text-white">
                      {block.file_name || 'FREE'}
                    </div>
                    <div className="text-[9px] text-white/80">
                      {block.next_block !== null && block.next_block !== undefined ? (
                        <span className="flex items-center space-x-0.5">
                          <span>→</span>
                          <span>B{block.next_block}</span>
                        </span>
                      ) : (
                        <span>256B</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Disk Block Inspector */}
            {selectedBlock && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-purple-300 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>Disk Block #{selectedBlock.block_id} Inspector</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 uppercase text-[10px]">
                      {selectedBlock.block_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {selectedBlock.is_used
                      ? `Allocated to file: ${selectedBlock.file_name} (${selectedBlock.file_path})`
                      : 'Free Block (available for file allocation)'}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
                  <div>Offset: 0x{((selectedBlock.block_id * 256).toString(16)).padStart(4, '0').toUpperCase()}</div>
                  {selectedBlock.next_block !== null && selectedBlock.next_block !== undefined && (
                    <div className="text-emerald-400">Next Ptr: B{selectedBlock.next_block}</div>
                  )}
                  <button
                    onClick={() => setSelectedBlock(null)}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text Editor Modal */}
      {editorFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl glass-panel border border-white/20 shadow-2xl flex flex-col overflow-hidden text-xs">
            <div className="h-10 px-4 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center space-x-2">
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                <span>Editing {editorFile.name}</span>
              </span>
              <button
                onClick={() => setEditorFile(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={14}
                className="w-full h-full p-3 rounded-xl bg-slate-950 font-mono text-slate-100 border border-white/20 outline-none resize-none leading-relaxed"
              />
            </div>
            <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Size: {editorContent.length} bytes (approx.{' '}
                {Math.ceil(Math.max(1, editorContent.length) / 256)} disk blocks)
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditorFile(null)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditor}
                  className="px-4 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold flex items-center space-x-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Virtual Disk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass-panel p-5 border border-white/20 shadow-2xl text-xs space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FilePlus className="w-4 h-4 text-sky-400" />
              <span>Create New File</span>
            </h3>
            <form onSubmit={handleCreateFile} className="space-y-3">
              <input
                type="text"
                placeholder="filename.txt or script.py"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass-panel p-5 border border-white/20 shadow-2xl text-xs space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>Create New Folder</span>
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
