'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentUpload, UploadProgress } from '../types';

interface DocumentUploaderProps {
  driverId: string;
  onUploadComplete: (documents: Record<string, string>) => void;
  initialDocuments?: Record<string, string>;
}

const DOCUMENT_TYPES = [
  { key: 'driverLicense', label: "Driver's License", required: true },
  { key: 'vehicleRegistration', label: 'Vehicle Registration', required: true },
  { key: 'vehicleInsurance', label: 'Vehicle Insurance', required: true },
  { key: 'vehiclePhoto', label: 'Vehicle Photo', required: false },
  { key: 'profilePhoto', label: 'Profile Photo', required: false },
];

export function DocumentUploader({
  driverId,
  onUploadComplete,
  initialDocuments = {},
}: DocumentUploaderProps) {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>(
    initialDocuments
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = async (fileType: string, file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPEG, PNG, WebP, or PDF files.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Set initial upload state
    setUploads((prev) => ({
      ...prev,
      [fileType]: {
        fileType,
        progress: 0,
        status: 'pending',
      },
    }));

    try {
      // Get pre-signed URL from server
      setUploads((prev) => ({
        ...prev,
        [fileType]: { ...prev[fileType], status: 'uploading', progress: 10 },
      }));

      const response = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          fileType,
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { data } = await response.json();
      const { url, key } = data;

      // Upload file to S3
      setUploads((prev) => ({
        ...prev,
        [fileType]: { ...prev[fileType], progress: 30 },
      }));

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Mark as completed
      setUploads((prev) => ({
        ...prev,
        [fileType]: { ...prev[fileType], progress: 100, status: 'completed' },
      }));

      // Update uploaded documents
      const newDocs = { ...uploadedDocs, [fileType]: key };
      setUploadedDocs(newDocs);
      onUploadComplete(newDocs);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploads((prev) => ({
        ...prev,
        [fileType]: {
          ...prev[fileType],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed',
        },
      }));
    }
  };

  const handleRemoveFile = (fileType: string) => {
    const newDocs = { ...uploadedDocs };
    delete newDocs[fileType];
    setUploadedDocs(newDocs);

    const newUploads = { ...uploads };
    delete newUploads[fileType];
    setUploads(newUploads);

    onUploadComplete(newDocs);
  };

  const getStatusIcon = (fileType: string) => {
    const upload = uploads[fileType];
    if (!upload) {
      return uploadedDocs[fileType] ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : null;
    }

    switch (upload.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
      case 'pending':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const upload = uploads[docType.key];
          const isUploaded = uploadedDocs[docType.key];
          const isUploading = upload?.status === 'uploading' || upload?.status === 'pending';

          return (
            <div
              key={docType.key}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-sm text-gray-700">
                    {docType.label}
                    {docType.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
                {getStatusIcon(docType.key)}
              </div>

              {isUploaded && !isUploading ? (
                <div className="flex items-center justify-between bg-green-50 rounded p-2">
                  <span className="text-sm text-green-700 truncate flex-1">
                    Uploaded successfully
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(docType.key)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[docType.key] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(docType.key, file);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[docType.key]?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {isUploading ? 'Uploading...' : 'Choose File'}
                    </span>
                  </button>
                </>
              )}

              {upload?.status === 'uploading' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{upload.progress}%</p>
                </div>
              )}

              {upload?.status === 'failed' && (
                <p className="text-xs text-red-600 mt-2">{upload.error}</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        * Required documents. Accepted formats: JPEG, PNG, WebP, PDF (max 5MB)
      </p>
    </div>
  );
}
