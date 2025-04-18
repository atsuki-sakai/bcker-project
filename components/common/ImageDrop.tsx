'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileImage, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// コンポーネントのプロップス型定義
interface ImageDropProps {
  onFileSelect?: (file: File) => void;
  onPreviewChange?: (previewUrl: string | null) => void;
  onUploadComplete?: (filePath: string) => void;
  maxSizeMB?: number;
  previewWidth?: number;
  previewHeight?: number;
  className?: string;
  placeholderText?: string;
  accept?: string;
  initialImageUrl?: string;
}

export default function ImageDrop({
  onFileSelect,
  onPreviewChange,
  maxSizeMB = 4,
  previewWidth = 192,
  previewHeight = 192,
  className = '',
  placeholderText = '画像をドラッグするか、クリックして選択',
  accept = 'image/*',
  initialImageUrl,
}: ImageDropProps) {
  // 内部状態の管理
  const [isDragging, setIsDragging] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 実際に使用するプレビュー画像（外部から渡されるか内部で管理されるか）
  const displayImageUrl = previewImageUrl || initialImageUrl;

  // ファイル変更時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        processFile(file);
      }
    }
  };

  // ファイルの処理を統一する関数
  const processFile = async (file: File) => {
    const maxSize = maxSizeMB * 1024 * 1024; // MBをバイトに変換

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルのみアップロードできます。');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // サイズチェック
    if (file.size > maxSize) {
      toast.error(
        `ファイルサイズが大きすぎます。${maxSizeMB}MB以下の画像をアップロードしてください。`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // プレビュー画像を更新する
    const previewUrl = URL.createObjectURL(file);
    setPreviewImageUrl(previewUrl);
    if (onPreviewChange) {
      onPreviewChange(previewUrl);
    }

    // ファイルが有効な場合、onFileSelect コールバックを呼び出す
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  // ドラッグ＆ドロップ関連のイベントハンドラ
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file) return alert('file is null');
      processFile(file);

      // fileInputの値も更新（表示用）
      if (fileInputRef.current) {
        // Fileオブジェクトを直接代入できないため、DataTransferを使用
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  // プレビューをクリアする関数
  const clearPreview = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreviewImageUrl(initialImageUrl || null);
    if (onPreviewChange) {
      onPreviewChange(initialImageUrl || null);
    }
    if (onFileSelect) {
      // Pass null or a specific signal to indicate clearing
      // onFileSelect(null as unknown as File); // Example, adjust as needed
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 transition-colors text-center h-[270px] ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-indigo-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {displayImageUrl ? (
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          <Image
            src={displayImageUrl}
            alt="Preview"
            className="mx-auto rounded-md object-contain max-h-[192px] max-w-[192px]"
            width={previewWidth}
            height={previewHeight}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 rounded-full bg-blue-600 hover:bg-blue-600 text-white hover:text-white shadow-md"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
          {fileInputRef.current?.files?.[0] && (
            <div className="text-xs text-gray-500 mt-2 text-start">
              <p>
                <span className="font-bold">ファイル名</span>{' '}
                {fileInputRef.current?.files?.[0].name}
              </p>
              <p>
                <span className="font-bold">サイズ</span>{' '}
                {(fileInputRef.current?.files?.[0].size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <FileImage
            className={`h-12 w-12 mx-auto mb-2 transition-colors ${
              isDragging ? 'text-indigo-500' : 'text-indigo-300'
            }`}
          />
          <p
            className={`text-sm mb-2 transition-colors ${
              isDragging ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            {isDragging ? 'ここにファイルをドロップ' : placeholderText}
          </p>
          <p className="text-xs text-gray-400">JPG、PNG / 最大{maxSizeMB}MB</p>
        </div>
      )}
      <Input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        className={`${
          displayImageUrl ? 'hidden' : 'opacity-0 absolute inset-0 cursor-pointer w-full h-full'
        }`}
      />
    </div>
  );
}
