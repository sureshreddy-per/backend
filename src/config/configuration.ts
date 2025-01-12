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
});
