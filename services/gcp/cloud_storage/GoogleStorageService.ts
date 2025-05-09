import { Storage } from '@google-cloud/storage';
import { UploadResult } from './types';
import { STORAGE_URL } from './constants';
import { throwConvexError } from '@/lib/error';

/**
 * GCSクライアントとバケット設定を管理するクラス
 */
class GoogleStorageService {
  private storage: Storage | null = null;
  private bucketName: string | null = null;

  /**
   * 必要な環境変数を取得し、存在しない場合はエラーを投げる
   */
  private getEnvConfig() {
    const projectId = process.env.GCP_PROJECT;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY;
    const bucketName = process.env.NEXT_PUBLIC_GCP_STORAGE_BUCKET_NAME;
    if (!projectId || !clientEmail || !privateKey || !bucketName) {
      throw throwConvexError({
        message: '必要な環境変数が不足しています',
        status: 500,
        code: 'INTERNAL_ERROR',
        title: '必要な環境変数が不足しています',
        callFunc: 'GoogleStorageService.getEnvConfig',
        severity: 'low',
        details: {
          projectId: Boolean(projectId),
          clientEmail: Boolean(clientEmail),
          privateKey: Boolean(privateKey),
        },
      });
    }
    return { projectId, clientEmail, privateKey, bucketName };
  }

  /**
   * 必要なときにGCSクライアントを初期化する
   */
  private initializeIfNeeded() {
    if (this.storage !== null) {
      return;
    }

    // 必要な環境変数をまとめて取得
    const { projectId, clientEmail, privateKey, bucketName } = this.getEnvConfig();
    try {
      // 改行のエスケープ解除（もし \n で設定している場合）
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      // Storage クライアントの初期化
      this.storage = new Storage({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: formattedPrivateKey,
        },
      });

      this.bucketName = bucketName;
    } catch (error) {
      throw throwConvexError({
        message: 'GCPストレージクライアントの初期化に失敗しました',
        status: 500,
        code: 'INTERNAL_ERROR',
        title: 'GCPストレージクライアントの初期化に失敗しました',
        callFunc: 'GoogleStorageService.initializeIfNeeded',
        severity: 'low',
        details: { error: this.formatErrorDetails(error) },
      });
    }
  }

  /**
   * エラー詳細を抽出するユーティリティメソッド
   */
  private formatErrorDetails(error: unknown): Record<string, any> {
    const errorDetails: Record<string, any> = { type: typeof error };
    if (error instanceof Error) {
      errorDetails.name = error.name;
      errorDetails.message = error.message;
      errorDetails.stack = error.stack;
      Object.keys(error).forEach((key) => {
        try {
          const value = (error as any)[key];
          if (typeof value !== 'function') {
            errorDetails[key] = value;
          }
        } catch (e) {}
      });
    } else {
      try {
        errorDetails.stringified = JSON.stringify(error);
      } catch (e) {
        errorDetails.stringifyFailed = true;
      }
    }
    return errorDetails;
  }

  /**
   * バッファからファイルをアップロードする
   */
  async uploadFileBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    directory: string
  ): Promise<UploadResult> {
    this.initializeIfNeeded();

    try {
      const bucket = this.storage!.bucket(this.bucketName!);
      const timestamp = Date.now();
      const filePath = `${directory}/${timestamp}-${fileName}`;
      const blob = bucket.file(filePath);

      // バッファから直接アップロード
      await blob.save(buffer, {
        contentType: contentType,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      // ファイルを公開状態に設定
      try {
        await blob.makePublic();
      } catch (publicError) {}

      // encode path segments so spaces etc. become %20 – keeps DB key “raw” but URL safe
      const publicUrl = `${STORAGE_URL}/${this.bucketName}/${encodeURI(filePath)}`;

      return {
        publicUrl,
        filePath,
      };
    } catch (error) {
      const errorDetails = this.formatErrorDetails(error);
      throw throwConvexError({
        message: 'バッファからのアップロードに失敗しました',
        status: 500,
        code: 'INTERNAL_ERROR',
        title: 'バッファからのアップロードに失敗しました',
        callFunc: 'GoogleStorageService.uploadFileBuffer',
        severity: 'low',
        details: {
          fileName,
          contentType,
          bufferSize: buffer.length,
          directory,
          error: errorDetails,
        },
      });
    }
  }

  /**
   * imgUrl から GCS 内のファイルパスを抽出する
   */
  private extractFilePath(imgUrl: string): string {
    try {
      const url = new URL(imgUrl);
      // URL.pathname is "/bucketName/path/to/file"
      const segments = url.pathname.split('/');
      // Remove the leading empty segment and bucket name
      const fileSegments = segments.slice(2);
      return fileSegments.join('/');
    } catch {
      // If imgUrl isn't a full URL, assume it's already the object path
      return imgUrl;
    }
  }

  /**
   * ファイルを削除する
   */
  async deleteImage(imgUrl: string): Promise<void> {
    this.initializeIfNeeded();

    // decode in case imgUrl or stored key is URL‑encoded
    const filePath = decodeURIComponent(this.extractFilePath(imgUrl));
    console.log('Deleting GCS object path:', filePath);

    try {
      const bucket = this.storage!.bucket(this.bucketName!);
      const file = bucket.file(filePath);
      await file.delete();
    } catch (error) {
      const errorDetails = this.formatErrorDetails(error);
      const errAny = error as any;
      // If the object is not found, skip deletion
      if (errAny.code === 404 || errorDetails.code === 404) {
        console.warn(`GCS object not found, skipping deletion: ${filePath}`);
        return;
      }
      // Remove non-serializable fields
      delete (errorDetails as any).response;
      throw throwConvexError({
        message: 'ファイルの削除に失敗しました',
        status: 500,
        code: 'INTERNAL_ERROR',
        title: 'ファイルの削除に失敗しました',
        callFunc: 'GoogleStorageService.deleteImage',
        severity: 'low',
        details: { error: errorDetails },
      });
    }
  }
}

export const gcsService = new GoogleStorageService();