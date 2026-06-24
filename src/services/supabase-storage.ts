import { supabase } from './supabase';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/** 上传文件到指定存储桶 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; upsert?: boolean },
): Promise<UploadResult> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { path: data.path, publicUrl: urlData.publicUrl };
}

/** 下载文件，返回 Blob */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return data;
}

/** 列出存储桶中的文件 */
export async function listFiles(
  bucket: string,
  folder?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  },
) {
  const { data, error } = await supabase.storage.from(bucket).list(folder ?? '', {
    limit: options?.limit ?? 100,
    offset: options?.offset ?? 0,
    sortBy: options?.sortBy ?? { column: 'created_at', order: 'desc' },
  });

  if (error) throw error;
  return data ?? [];
}

/** 删除文件 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

/** 获取带签名的临时访问 URL */
export async function getSignedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
