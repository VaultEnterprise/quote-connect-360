import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileX, X } from "lucide-react";

export default function DocumentAttachmentField({
  label,
  file,
  onFileSelect,
  onRemove,
  acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg",
}) {
  const fileInputRef = useRef(null);

  const handleDragDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split(".").pop().toUpperCase();
    return ext;
  };

  return (
    <div className="space-y-2">
      {file ? (
        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 break-words">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getFileType(file.name)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <Badge variant="default" className="text-xs bg-green-600">
                  Uploaded
                </Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-600 hover:text-red-700 flex-shrink-0"
              onClick={onRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Replace
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDragDrop}
          className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="w-5 h-5 text-muted-foreground mb-2" />
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Drag and drop or click to select
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
        </div>
      )}
    </div>
  );
}