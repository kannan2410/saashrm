import { env } from './env';
import path from 'path';
import fs from 'fs';

const useAzure = !!env.azure.storageConnectionString;

// Local uploads directory (used when Azure is not configured)
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureLocalDir(containerName: string): string {
  const dir = path.join(UPLOADS_DIR, containerName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function uploadBlob(
  containerName: string,
  blobName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (useAzure) {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    const blobServiceClient = BlobServiceClient.fromConnectionString(env.azure.storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: undefined });
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  // Local file storage fallback
  const dir = ensureLocalDir(containerName);
  const safeBlobName = blobName.replace(/\//g, '_');
  const filePath = path.join(dir, safeBlobName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${containerName}/${safeBlobName}`;
}

export async function deleteBlob(containerName: string, blobName: string): Promise<void> {
  if (useAzure) {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    const blobServiceClient = BlobServiceClient.fromConnectionString(env.azure.storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
    return;
  }

  // Local file storage fallback
  const safeBlobName = blobName.replace(/\//g, '_');
  const filePath = path.join(UPLOADS_DIR, containerName, safeBlobName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
