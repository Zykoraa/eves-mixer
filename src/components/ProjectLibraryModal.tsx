import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  X,
  Save,
  Trash2,
  Clock,
  Music,
  Download,
  CheckCircle2,
  HardDrive,
  Calendar,
  Layers,
} from 'lucide-react';
import { ProjectStorage } from '../store/projectStorage';
import { StoredProjectMeta } from '../types/daw';
import { useDawStore } from '../store/useDawStore';
import { MidiExporter } from '../audio/MidiExporter';

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectLibraryModal: React.FC<ProjectLibraryModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const [projects, setProjects] = useState<StoredProjectMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState(state.projectName);
  const [notice, setNotice] = useState<string | null>(null);

  const loadProjectList = async () => {
    setIsLoading(true);
    try {
      const list = await ProjectStorage.listProjects();
      setProjects(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjectList();
      setNewProjectName(state.projectName);
    }
  }, [isOpen, state.projectName]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSaveCurrent = async () => {
    const id = `proj-${Date.now()}`;
    const name = newProjectName.trim() || state.projectName;

    const projectData = {
      projectName: name,
      bpm: state.bpm,
      swing: state.swing,
      selectedKey: state.selectedKey,
      selectedScale: state.selectedScale,
      tracks: state.tracks,
      patterns: state.patterns,
      clips: state.clips,
      synthParams: state.synthParams,
      totalBars: state.totalBars,
    };

    try {
      await ProjectStorage.saveProject(id, name, state.bpm, projectData);
      showNotice(`Saved "${name}" to IndexedDB Project Library!`);
      loadProjectList();
    } catch (e) {
      alert('Failed to save project to IndexedDB.');
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const data = await ProjectStorage.loadProject(id);
      if (data && data.tracks && data.patterns) {
        localStorage.setItem('eves_mixer_saved_state', JSON.stringify(data));
        window.location.reload();
      }
    } catch (e) {
      alert('Failed to load project from IndexedDB.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from IndexedDB?`)) return;
    try {
      await ProjectStorage.deleteProject(id);
      showNotice(`Deleted "${name}".`);
      loadProjectList();
    } catch (e) {
      alert('Failed to delete project.');
    }
  };

  const handleDownloadMidi = () => {
    MidiExporter.downloadMidi(state.projectName, state.bpm, state.tracks, state.patterns);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#151720] border border-[#2d3142] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#1b1e2a] border-b border-[#2b3040] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <HardDrive size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">IndexedDB Project Library</h2>
              <p className="text-xs text-gray-400">High-Capacity Offline Browser Storage (Bypasses 5MB limit)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282b3a] text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notice */}
        {notice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-5 py-2 flex items-center gap-2 text-xs font-mono text-emerald-300">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Save Current Section */}
        <div className="p-5 border-b border-[#242736] bg-[#12141c] flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase font-bold">
              Save Active Project to Library:
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name..."
              className="w-full bg-[#1b1e28] border border-[#333748] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleSaveCurrent}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Save size={14} />
            <span>Save to Library</span>
          </button>
        </div>

        {/* Saved Projects List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
            <span>SAVED PROJECTS ({projects.length})</span>
            <button onClick={handleDownloadMidi} className="text-cyan-400 hover:underline flex items-center gap-1">
              <Music size={12} />
              <span>Export Current as .MID</span>
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-8 text-xs font-mono text-gray-400">Loading library...</div>
          )}

          {!isLoading && projects.length === 0 && (
            <div className="text-center py-10 text-xs font-mono text-gray-500 border border-dashed border-[#2b3040] rounded-xl p-6">
              No saved projects found in IndexedDB. Click "Save to Library" above to save your work!
            </div>
          )}

          {!isLoading &&
            projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-[#181a24] border border-[#2b2f3e] hover:border-cyan-500/40 rounded-xl p-3.5 flex items-center justify-between transition-all shadow-md group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {proj.name}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 mt-1">
                    <span className="text-orange-400 font-bold">{proj.bpm} BPM</span>
                    <span>&bull;</span>
                    <span>{proj.trackCount} Tracks</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(proj.updatedAt).toLocaleDateString()} {new Date(proj.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoad(proj.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold transition-all"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id, proj.name)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
