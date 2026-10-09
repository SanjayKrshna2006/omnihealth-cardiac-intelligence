import React, { useRef } from 'react';
import { CheckCircle2, X, FileAudio, Video, FileText } from 'lucide-react';

interface FileDropzoneProps {
  label: string;
  sublabel: string;
  modality: 'ecg' | 'echo' | 'history';
  acceptedFormats: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  label,
  sublabel,
  modality,
  acceptedFormats,
  file,
  onFileSelect,
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const getModalityIcon = () => {
    switch (modality) {
      case 'ecg':
        return <FileAudio className="w-6 h-6 text-rose-500" />;
      case 'echo':
        return <Video className="w-6 h-6 text-blue-500" />;
      case 'history':
        return <FileText className="w-6 h-6 text-amber-500" />;
    }
  };

  const getBorderColor = () => {
    if (file) return 'border-emerald-400 bg-emerald-50/30';
    switch (modality) {
      case 'ecg':
        return 'hover:border-rose-300 hover:bg-rose-50/20';
      case 'echo':
        return 'hover:border-blue-300 hover:bg-blue-50/20';
      case 'history':
        return 'hover:border-amber-300 hover:bg-amber-50/20';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          {label}
          {required ? (
            <span className="text-red-500 font-semibold">*</span>
          ) : (
            <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
          )}
        </label>
        <span className="text-[11px] font-mono text-slate-400">{acceptedFormats}</span>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center group ${
          file ? 'border-emerald-400 bg-emerald-50/40' : `border-slate-200 bg-white ${getBorderColor()}`
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleChange}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              {getModalityIcon()}
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Drag and drop file here, or <span className="text-red-600 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{sublabel}</p>
          </>
        )}
      </div>
    </div>
  );
};
