export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRY || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  uploads: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 8,
    maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 50,
    maxDocumentSize: parseInt(process.env.MAX_DOCUMENT_SIZE_MB, 10) || 10,
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || "jpg,jpeg,png,gif").split(","),
    allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || "mp4,mov,avi").split(","),
    allowedDocumentTypes: (process.env.ALLOWED_DOCUMENT_TYPES || "pdf,doc,docx,txt,xls,xlsx").split(","),
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    useS3: process.env.USE_S3 === "true",
  },
  security: {
    // Admin users are configured through environment variables for security
    // ADMIN_USERS should be a comma-separated list of admin email addresses
    adminUsers: (process.env.ADMIN_USERS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    loginLockoutDuration:
      parseInt(process.env.LOGIN_LOCKOUT_DURATION, 10) || 900, // 15 minutes in seconds
    passwordPolicy: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
      requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL === "true",
      requireNumber: process.env.PASSWORD_REQUIRE_NUMBER === "true",
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === "true",
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === "true",
    },
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    keyFilePath: process.env.GCP_KEY_FILE_PATH,
    bucket: process.env.GCP_STORAGE_BUCKET,
  },
  // Choose storage provider ('s3' or 'gcp')
  storageProvider: process.env.STORAGE_PROVIDER || 'gcp',
});
