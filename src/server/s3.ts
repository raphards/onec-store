import process from 'node:process';
import { Buffer } from 'node:buffer';
import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.NEON_STORAGE_BUCKET || 'img-products';

// Initialize S3Client with forcePathStyle: true as instructed
export const s3 = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: process.env.AWS_ENDPOINT_URL_S3 || undefined,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

/**
 * Uploads a buffer directly to Neon Object Storage bucket
 */
export async function uploadToNeonStorage(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3.send(command);

    // Generate signed URL (expires in 7 days / 604800s, or direct URL)
    try {
      const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: bucket,
        Key: key
      }), { expiresIn: 604800 });
      return signedUrl;
    } catch {
      // If signed URL generation is not configured, return standard endpoint path
      const endpoint = process.env.AWS_ENDPOINT_URL_S3 || `https://${bucket}.s3.us-east-2.amazonaws.com`;
      return `${endpoint}/${key}`;
    }
  } catch (error) {
    console.error('Error uploading to Neon Object Storage:', error);
    throw error;
  }
}

/**
 * Generates a presigned GET URL for viewing an object
 */
export async function getObjectUrl(key: string, expiresIn = 86400): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}
