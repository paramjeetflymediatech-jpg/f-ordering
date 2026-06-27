import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Safely deletes a file from the local filesystem if the path matches an uploaded asset.
 * @param relativeUrl The relative URL of the asset (e.g., '/uploads/mitrandadhaba/logo/logo-xxx.png')
 */
export async function deleteUploadedFile(relativeUrl: string | null | undefined): Promise<void> {
  if (!relativeUrl) return;

  // Verify the URL path actually points to the local uploads directory
  if (!relativeUrl.startsWith('/uploads/')) return;

  // Reconstruct local path by stripping leading '/uploads/' and joining with process.cwd(), 'uploads'
  const relativePath = relativeUrl.replace(/^\/uploads\//, '');
  const filePath = path.join(process.cwd(), 'uploads', relativePath);
  const resolvedPath = path.resolve(filePath);
  const uploadsDir = path.resolve(path.join(process.cwd(), 'uploads'));

  // Security guard: Prevent directory traversal attacks
  if (!resolvedPath.startsWith(uploadsDir)) {
    console.warn(`[FileDelete] Blocked attempt to delete path outside uploads directory: ${relativeUrl}`);
    return;
  }

  try {
    if (existsSync(resolvedPath)) {
      await unlink(resolvedPath);
      console.log(`[FileDelete] Successfully deleted file: ${resolvedPath}`);
    }
  } catch (err: any) {
    console.error(`[FileDelete] Failed to delete file ${resolvedPath}:`, err.message);
  }
}
