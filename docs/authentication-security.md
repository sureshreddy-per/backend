# Authentication Security Guide

## OTP Security Best Practices

### 1. OTP Generation and Storage

\`\`\`typescript
// Secure OTP generation using crypto
import { randomBytes } from 'crypto';

class SecureOTPGenerator {
  private static readonly OTP_LENGTH = 6;
  private static readonly VALID_CHARS = '0123456789';
  
  static generate(): string {
    const buffer = randomBytes(this.OTP_LENGTH);
    let otp = '';
    
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += this.VALID_CHARS[buffer[i] % this.VALID_CHARS.length];
    }
    
    return otp;
  }
  
  static validate(otp: string): boolean {
    return (
      otp.length === this.OTP_LENGTH &&
      /^\d+$/.test(otp) &&
      !this.isSequential(otp) &&
      !this.isRepeating(otp)
    );
  }
  
  private static isSequential(otp: string): boolean {
    for (let i = 0; i < otp.length - 1; i++) {
      if (Math.abs(parseInt(otp[i]) - parseInt(otp[i + 1])) === 1) {
        return true;
      }
    }
    return false;
  }
  
  private static isRepeating(otp: string): boolean {
    return /(\d)\1{2,}/.test(otp);
  }
}
\`\`\`

### 2. Rate Limiting Implementation

\`\`\`typescript
// Rate limiting configuration with Redis
interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

class RateLimiter {
  constructor(private readonly redis: Redis) {}

  async checkLimit(config: RateLimitConfig): Promise<boolean> {
    const { key, limit, windowMs } = config;
    const now = Date.now();
    const windowKey = \`${key}:\${Math.floor(now / windowMs)}\`;
    
    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.pexpire(windowKey, windowMs);
    
    const [count] = await multi.exec();
    return count <= limit;
  }
}

// Rate limiting middleware
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientIp = request.ip;
    const endpoint = request.route.path;
    
    const configs: Record<string, RateLimitConfig> = {
      '/auth/customer/otp/request': {
        key: \`otp:request:\${clientIp}\`,
        limit: 5,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
      },
      '/auth/customer/otp/verify': {
        key: \`otp:verify:\${request.body.requestId}\`,
        limit: 3,
        windowMs: 15 * 60 * 1000, // 15 minutes
      },
    };
    
    const config = configs[endpoint];
    if (!config) return true;
    
    const allowed = await this.rateLimiter.checkLimit(config);
    if (!allowed) {
      throw new TooManyRequestsException({
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
    }
    
    return true;
  }
}
\`\`\`

### 3. Phone Number Validation

\`\`\`typescript
// Phone number validation with libphonenumber-js
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

class PhoneNumberValidator {
  private static readonly SUPPORTED_COUNTRIES = ['IN', 'US', 'GB', 'AE'];
  private static readonly BLOCKED_PATTERNS = [
    /^1234567890$/,
    /^0000000000$/,
    /(\d)\1{9}/, // Same digit repeated 10 times
  ];

  static validate(phoneNumber: string): {
    isValid: boolean;
    formattedNumber?: string;
    error?: string;
  } {
    try {
      if (!phoneNumber) {
        return { isValid: false, error: 'Phone number is required' };
      }

      // Basic format check
      if (!/^\+?[\d\s-]+$/.test(phoneNumber)) {
        return { isValid: false, error: 'Invalid phone number format' };
      }

      const parsed = parsePhoneNumber(phoneNumber);
      
      if (!parsed) {
        return { isValid: false, error: 'Could not parse phone number' };
      }

      // Country check
      if (!this.SUPPORTED_COUNTRIES.includes(parsed.country)) {
        return { 
          isValid: false, 
          error: \`Country not supported. Supported countries: \${this.SUPPORTED_COUNTRIES.join(', ')}\` 
        };
      }

      // Valid number check
      if (!isValidPhoneNumber(phoneNumber)) {
        return { isValid: false, error: 'Invalid phone number for country' };
      }

      // Check for blocked patterns
      if (this.BLOCKED_PATTERNS.some(pattern => 
        pattern.test(parsed.nationalNumber)
      )) {
        return { isValid: false, error: 'Phone number pattern not allowed' };
      }

      return {
        isValid: true,
        formattedNumber: parsed.format('E.164'), // +1234567890 format
      };
    } catch (error) {
      return { isValid: false, error: 'Invalid phone number' };
    }
  }
}
\`\`\`

### 4. Client-Side Authentication Flow

\`\`\`typescript
// React hooks for OTP authentication
import { useState, useCallback } from 'react';
import { useTimer } from 'react-timer-hook';

interface UseOTPAuth {
  phoneNumber: string;
  onSuccess: (token: string) => void;
  onError: (error: Error) => void;
}

export const useOTPAuth = ({ 
  phoneNumber, 
  onSuccess, 
  onError 
}: UseOTPAuth) => {
  const [requestId, setRequestId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  
  // OTP resend timer
  const { seconds, restart } = useTimer({
    expiryTimestamp: new Date(),
    onExpire: () => setCanResend(true),
  });
  
  const [canResend, setCanResend] = useState(true);

  // Request OTP
  const requestOTP = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // Validate phone number
      const validation = PhoneNumberValidator.validate(phoneNumber);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const response = await fetch('/auth/customer/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobileNumber: validation.formattedNumber 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setRequestId(data.requestId);
      
      // Start resend timer
      const time = new Date();
      time.setSeconds(time.getSeconds() + data.expiresIn);
      restart(time);
      setCanResend(false);
      
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, restart, onError]);

  // Verify OTP
  const verifyOTP = useCallback(async (otp: string) => {
    try {
      setIsLoading(true);
      setError(undefined);

      if (!requestId) {
        throw new Error('Please request OTP first');
      }

      if (!SecureOTPGenerator.validate(otp)) {
        throw new Error('Invalid OTP format');
      }

      const response = await fetch('/auth/customer/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, otp }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Update remaining attempts
        if (response.status === 429) {
          setRemainingAttempts(0);
          throw new Error('Too many attempts. Please request new OTP.');
        } else {
          setRemainingAttempts(prev => prev - 1);
          throw new Error(data.message || 'Invalid OTP');
        }
      }

      onSuccess(data.access_token);
      
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [requestId, onSuccess, onError]);

  return {
    requestOTP,
    verifyOTP,
    isLoading,
    error,
    canResend,
    remainingAttempts,
    resendWaitTime: seconds,
  };
};

// Example usage in React component
const OTPAuthComponent: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOTP] = useState('');
  
  const {
    requestOTP,
    verifyOTP,
    isLoading,
    error,
    canResend,
    remainingAttempts,
    resendWaitTime,
  } = useOTPAuth({
    phoneNumber,
    onSuccess: (token) => {
      // Store token and redirect
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    },
    onError: (error) => {
      console.error('Authentication error:', error);
    },
  });

  return (
    <div className="otp-auth-container">
      <div className="phone-input">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          disabled={isLoading}
        />
        <button
          onClick={requestOTP}
          disabled={isLoading || !canResend}
        >
          {canResend ? 'Send OTP' : \`Resend in \${resendWaitTime}s\`}
        </button>
      </div>

      {remainingAttempts > 0 && (
        <div className="otp-input">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            disabled={isLoading}
          />
          <button
            onClick={() => verifyOTP(otp)}
            disabled={isLoading || otp.length !== 6}
          >
            Verify OTP
          </button>
          <div className="attempts">
            Remaining attempts: {remainingAttempts}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};
\`\`\`

## Security Recommendations Summary

### OTP Generation
1. Use cryptographically secure random number generation
2. Implement minimum OTP length (6 digits)
3. Avoid sequential and repeating patterns
4. Use time-based expiry (5-10 minutes)
5. Hash OTP before storage
6. Never log or expose OTP in responses

### Rate Limiting
1. Limit OTP requests per phone number (5/day)
2. Limit verification attempts per OTP (3 attempts)
3. Implement cooldown periods after failed attempts
4. Use sliding window rate limiting
5. Track IP-based rate limits
6. Implement device fingerprinting

### Phone Number Validation
1. Use proper phone number parsing library
2. Validate country codes
3. Check for valid number formats
4. Block known test/fake numbers
5. Implement blacklist for abuse
6. Validate carrier type (optional)

### Client-Side Security
1. Implement proper input validation
2. Show remaining attempts
3. Implement resend cooldown
4. Clear OTP input on error
5. Implement session timeout
6. Use secure token storage

### Additional Measures
1. Monitor failed attempts
2. Implement fraud detection
3. Set up alerts for suspicious activity
4. Regular security audits
5. Compliance with regulations
6. User notification for security events 