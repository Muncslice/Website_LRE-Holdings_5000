import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  maxSizeKB?: number;
  accept?: string;
  preview?: boolean;
}

export default function ImageUploader({
  onImageSelect,
  maxSizeKB = 300,
  accept = 'image/jpeg,image/png',
  preview = true,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);

    try {
      // Compress image
      const options = {
        maxSizeMB: maxSizeKB / 1024,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);

      // Create preview
      if (preview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      }

      onImageSelect(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
      />

      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-slate-700"
          />
          <Button
            onClick={clearImage}
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-slate-800"
        >
          <Upload className="w-12 h-12 text-slate-400 mb-2" />
          <span className="text-sm text-slate-400">
            {isCompressing ? 'Compressing...' : 'Click to upload image'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Max {maxSizeKB}KB (auto-compressed)
          </span>
        </label>
      )}
    </div>
  );
}