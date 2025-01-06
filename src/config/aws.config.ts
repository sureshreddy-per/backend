import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    signedUrlExpires: 60 * 60 * 24 * 7, // 7 days
  },
})); 