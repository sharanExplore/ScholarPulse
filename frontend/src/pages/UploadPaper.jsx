import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import AgentProgressModal from '../components/Loading/AgentProgressModal';

export default function UploadPaper({
  onAnalysisComplete,
  onNavigate,
  showToast
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid format. Please upload an academic document in PDF format (.pdf).');
      return;
    }
    // Max size: 50MB
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('The selected file exceeds the 50MB size limit. Please choose a smaller PDF.');
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setUploadError(null);

    try {
      // Execute the multi-agent pipeline via FastAPI
      const result = await api.uploadPaper(selectedFile);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback if canvas-confetti is not loaded
      }

      showToast({
        type: 'success',
        message: `Paper "${selectedFile.name}" analyzed successfully!`
      });

      // Pass result to parent and switch to Analysis view
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Paper upload failed:', err);
      setUploadError(err.message || 'Analysis pipeline encountered an error. Please try again.');
      showToast({
        type: 'error',
        message: err.message || 'Failed to analyze paper.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Agent Research Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Analyze a Research Paper
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Upload an academic PDF and let ScholarPulse extract structured metadata, generate comprehensive summaries, and discover related literature.
        </p>
      </div>

      {/* Upload Box Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-10 space-y-6">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
        />

        {!selectedFile ? (
          /* Dropzone */
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-slate-800">
                Drag & drop your research paper PDF here
              </p>
              <p className="text-xs text-slate-500">
                or <span className="text-indigo-600 font-semibold underline">browse files</span> from your computer
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
                Format: PDF (.pdf)
              </span>
              <span>•</span>
              <span>Max file size: 50MB</span>
              <span>•</span>
              <span>Layout & equation safe</span>
            </div>
          </div>
        ) : (
          /* Selected File Preview */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)} • PDF Document Ready
                  </p>
                </div>
              </div>

              <button
                onClick={handleRemoveFile}
                disabled={isAnalyzing}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleRemoveFile}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold border border-slate-200 transition-colors"
              >
                Choose Different File
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Execute Multi-Agent Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold">Upload Error: </span>
              {uploadError}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Agent processing details info */}
      <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-indigo-950 flex items-center gap-2 text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>What happens during analysis?</span>
        </h4>
        <p className="leading-relaxed">
          ScholarPulse streams your paper through 6 dedicated AI agents: extracting textual structure, compiling executive summaries, isolating domain keywords, resolving citations against in-text contexts, and querying arXiv & CrossRef for relevant literature.
        </p>
      </div>

      {/* Animated Pipeline Stage Modal */}
      <AgentProgressModal
        isAnalyzing={isAnalyzing}
        filename={selectedFile?.name}
      />
    </div>
  );
}
