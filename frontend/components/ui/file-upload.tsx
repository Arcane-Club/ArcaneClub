"use client";

import * as React from "react";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelect?: (file: File | null) => void;
  value?: File | null; // Controlled file object (optional)
  helperText?: string;
  previewUrl?: string; // Optional preview for images
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, onFileSelect, value, helperText, accept, previewUrl, ...props }, ref) => {
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = React.useState<string | null>(value?.name || null);
    const [preview, setPreview] = React.useState<string | null>(previewUrl || null);

    React.useEffect(() => {
        if (value) {
            setFileName(value.name);
            if (value.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => setPreview(e.target?.result as string);
                reader.readAsDataURL(value);
            } else {
                setPreview(null);
            }
        } else {
            setFileName(null);
            setPreview(previewUrl || null);
        }
    }, [value, previewUrl]);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        setFileName(file.name);
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
        if (onFileSelect) onFileSelect(file);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setFileName(file.name);
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
        if (onFileSelect) onFileSelect(file);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        if (onFileSelect) onFileSelect(null);
    }

    return (
      <div className={cn("w-full group", className)}>
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ease-in-out",
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
             (fileName || preview) ? "border-green-500/50 bg-green-50/30 dark:border-green-500/30 dark:bg-green-900/10" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={(node) => {
                inputRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={accept}
            {...props}
          />
          
          {preview ? (
              <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
                  <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain shadow-sm" />
                  <p className="mt-2 text-xs text-gray-500 truncate max-w-[80%]">{fileName}</p>
                  <button 
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                    title="移除文件"
                >
                    <X className="w-4 h-4" />
                </button>
              </div>
          ) : fileName ? (
             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-green-600 dark:text-green-400">
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                    <File className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-gray-500 mt-1">点击或拖拽以更换</p>
                <button 
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500 dark:text-gray-400 px-4 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                点击上传 或拖拽文件到此处
                </p>
                {helperText && <p className="text-xs text-gray-500 dark:text-gray-500">{helperText}</p>}
                {accept && <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">{accept.replace(/,/g, ' ')}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";
