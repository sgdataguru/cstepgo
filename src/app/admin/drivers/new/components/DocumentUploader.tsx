'use client';

import { useState, useRef } from 'react';

interface DocumentUploaderProps {
  label: string;
  documentType: string;
  accept?: string;
  maxSize?: number; // in MB
  onUpload: (documentType: string, url: string) => void;
}

export function DocumentUploader({
  label,
  documentType,
  accept = 'image/*,application/pdf',
  maxSize = 5,
  onUpload,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    setError(null);
    setUploading(true);
    
    try {
      // Mock S3 upload - convert to base64 for now
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Set preview for images
        if (file.type.startsWith('image/')) {
          setPreview(result);
        }
        
        setFileName(file.name);
        onUpload(documentType, result);
        setUploading(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Failed to upload file');
      setUploading(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpload(documentType, '');
  };
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {!fileName ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-teal-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 mb-1">
                <span className="text-teal-600 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Max file size: {maxSize}MB
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border-2 border-green-500 bg-green-50/30 rounded-lg p-4">
          {preview && (
            <div className="mb-3">
              <img
                src={preview}
                alt="Preview"
                className="h-32 w-full object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500">Uploaded successfully</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
