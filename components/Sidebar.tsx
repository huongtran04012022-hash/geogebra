import React, { useState, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Eraser, 
  Terminal, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  BrainCircuit,
  PenTool,
  Loader2,
  ImagePlus,
  ImageIcon
} from 'lucide-react';
import { EXAMPLES } from '../constants';
import { LogMessage, ExampleProblem } from '../types';
import { extractProblemFromImage } from '../services/geminiService';

interface SidebarProps {
  onGenerate: (prompt: string) => void;
  onClear: () => void;
  logs: LogMessage[];
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerate, onClear, logs, isLoading }) => {
  const [input, setInput] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onGenerate(input);
    }
  };

  const handleExampleClick = (ex: ExampleProblem) => {
    setInput(ex.prompt);
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn file ảnh (PNG, JPEG).');
      return;
    }

    setIsAnalyzingImage(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const extractedText = await extractProblemFromImage(base64String, file.type);
          if (extractedText) {
            setInput(prev => {
              const prefix = prev ? prev + "\n\n" : "";
              return prefix + extractedText;
            });
          }
        } catch (error) {
          console.error("Error extracting text:", error);
          alert("Không thể đọc được ảnh. Vui lòng thử lại.");
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsAnalyzingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
        return;
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full md:w-[450px] flex flex-col h-full bg-white border-r border-teal-100 shadow-xl z-20">
      {/* Header */}
      <div className="p-5 border-b border-teal-100 bg-teal-50/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <PenTool size={20} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">GeoGebra <span className="text-teal-600">AI</span></h1>
            <p className="text-xs text-teal-600/80 font-medium uppercase tracking-wider">Trần Thị Hương</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-5 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        <div className="mb-4 relative">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit size={14} />
              Mô tả bài toán
            </label>
            <button 
              onClick={triggerFileUpload}
              disabled={isAnalyzingImage || isLoading}
              className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-200"
              title="Tải ảnh lên hoặc dán (Ctrl+V) vào khung bên dưới"
            >
              <ImagePlus size={14} />
              <span>Thêm ảnh</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
            />
          </div>
          
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="Nhập đề bài hoặc dán ảnh (Ctrl+V) vào đây..."
              disabled={isAnalyzingImage}
              className={`w-full h-32 p-4 bg-slate-50 border rounded-xl text-sm transition-all resize-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                isAnalyzingImage ? 'opacity-50 cursor-wait border-teal-300' : 'border-slate-200'
              }`}
            />
            {isAnalyzingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
                <div className="flex flex-col items-center gap-2 text-teal-600">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs font-semibold bg-white px-2 py-1 rounded-full shadow-sm">Đang đọc ảnh...</span>
                </div>
              </div>
            )}
            {!isAnalyzingImage && !input && (
              <div className="absolute bottom-3 right-3 pointer-events-none opacity-40">
                <ImageIcon size={18} />
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-right italic">
            Hỗ trợ dán ảnh trực tiếp (Ctrl+V)
          </p>
        </div>

        {/* Examples */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Bài toán mẫu
          </label>
          <div className="grid gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleExampleClick(ex)}
                className="text-left px-4 py-3 bg-white border border-slate-100 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    {ex.icon === 'triangle' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3l-8-14z"/></svg>}
                    {ex.icon === 'square' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>}
                    {ex.icon === 'circle' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>}
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-teal-700">{ex.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={onClear}
            className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors font-medium text-sm flex items-center gap-2"
            disabled={isLoading || isAnalyzingImage}
          >
            <Eraser size={16} />
            <span className="hidden sm:inline">Xóa</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || isAnalyzingImage || !input.trim()}
            className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-teal-500/30 transition-all transform active:scale-95 ${
              isLoading || isAnalyzingImage || !input.trim()
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:brightness-110'
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
            <span>{isLoading ? 'Đang phân tích...' : 'Vẽ hình ngay'}</span>
          </button>
        </div>

        {/* Logs Console */}
        <div className="flex-1 flex flex-col min-h-[150px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-mono text-teal-400 flex items-center gap-2">
              <Terminal size={12} /> Console Output
            </span>
            <span className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span>
              <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
            </span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs custom-scrollbar">
            {logs.length === 0 && (
              <div className="text-slate-500 italic p-2">Sẵn sàng chờ lệnh...</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="mb-1.5 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <span className="mt-0.5 opacity-70">
                  {log.type === 'command' && <ChevronRight size={12} className="text-teal-400" />}
                  {log.type === 'info' && <Info size={12} className="text-blue-400" />}
                  {log.type === 'success' && <CheckCircle2 size={12} className="text-green-400" />}
                  {log.type === 'error' && <AlertTriangle size={12} className="text-red-400" />}
                </span>
                <span className={`break-words leading-relaxed ${
                  log.type === 'command' ? 'text-teal-200' :
                  log.type === 'success' ? 'text-green-300' :
                  log.type === 'error' ? 'text-red-300' :
                  'text-slate-300'
                }`}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
