# Authentication Implementation Guide

## SSO Implementation

### 1. Google SSO

#### Setup
1. Create a project in Google Cloud Console
2. Configure OAuth 2.0 credentials
3. Add authorized domains and redirect URIs

#### Client-Side Implementation
\`\`\`typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // Send token to backend
    const response = await fetch('/auth/buyer/sso/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: result.user.email,
        provider: 'GOOGLE',
        token: credential.idToken,
      }),
    });

    const data = await response.json();
    // Store JWT token
    localStorage.setItem('token', data.access_token);
    
  } catch (error) {
    console.error('Google login failed:', error);
  }
};
\`\`\`

### 2. Microsoft SSO

#### Setup
1. Register application in Azure Portal
2. Configure authentication settings
3. Add redirect URIs

#### Client-Side Implementation
\`\`\`typescript
import { MsalClient } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'your_client_id',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'your_redirect_uri',
  },
};

const loginWithMicrosoft = async () => {
  try {
    const msalClient = new MsalClient(msalConfig);
    const response = await msalClient.loginPopup({
      scopes: ['user.read', 'email'],
    });
    
    // Send token to backend
    const apiResponse = await fetch('/auth/buyer/sso/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: response.account.username,
        provider: 'MICROSOFT',
        token: response.accessToken,
      }),
    });

    const data = await apiResponse.json();
    localStorage.setItem('token', data.access_token);
    
  } catch (error) {
    console.error('Microsoft login failed:', error);
  }
};
\`\`\`

### 3. Apple SSO

#### Setup
1. Configure Apple Developer Account
2. Create App ID and Service ID
3. Generate client secret

#### Client-Side Implementation
\`\`\`typescript
import AppleSignIn from 'apple-sign-in-browser';

const loginWithApple = async () => {
  try {
    const response = await AppleSignIn.auth({
      clientId: 'your_client_id',
      scope: 'email name',
      redirectURI: 'your_redirect_uri',
    });
    
    // Send token to backend
    const apiResponse = await fetch('/auth/buyer/sso/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: response.email,
        provider: 'APPLE',
        token: response.authorization.id_token,
      }),
    });

    const data = await apiResponse.json();
    localStorage.setItem('token', data.access_token);
    
  } catch (error) {
    console.error('Apple login failed:', error);
  }
};
\`\`\`

## OTP Implementation

### Phone Number Validation

\`\`\`typescript
// Phone number validation rules
const phoneNumberRules = {
  minLength: 10,
  maxLength: 15,
  allowedFormats: [
    '+[country_code][number]',  // e.g., +911234567890
    '[country_code][number]',   // e.g., 911234567890
  ],
  supportedCountryCodes: [
    '+91', // India
    '+1',  // USA/Canada
    // Add more country codes
  ],
};

const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove spaces and hyphens
  const cleaned = phoneNumber.replace(/[\s-]/g, '');
  
  // Check length
  if (cleaned.length < phoneNumberRules.minLength || 
      cleaned.length > phoneNumberRules.maxLength) {
    return false;
  }
  
  // Check format
  const hasValidFormat = /^\+?\d+$/.test(cleaned);
  if (!hasValidFormat) {
    return false;
  }
  
  // Check country code
  const hasValidCountryCode = phoneNumberRules.supportedCountryCodes.some(
    code => cleaned.startsWith(code.replace('+', '')) || 
           cleaned.startsWith('+' + code.replace('+', ''))
  );
  
  return hasValidCountryCode;
};
\`\`\`

### OTP Generation and Validation

\`\`\`typescript
// OTP configuration
const otpConfig = {
  length: 6,
  expiry: 300, // 5 minutes in seconds
  maxAttempts: 3,
  cooldownPeriod: 60, // 1 minute in seconds
};

// Rate limiting configuration
const rateLimits = {
  requestOTP: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 5, // per phone number
  },
  verifyOTP: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 3, // per request ID
  },
};

// Client-side OTP handling
const requestOTP = async (phoneNumber: string, userType: 'buyer' | 'customer') => {
  try {
    const endpoint = userType === 'buyer' 
      ? '/auth/buyer/phone/request'
      : '/auth/customer/otp/request';
      
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        // Add additional fields for first-time users
        ...(userType === 'buyer' && { companyName }),
        ...(userType === 'customer' && {
          name,
          farmLat,
          farmLng,
        }),
      }),
    });

    const data = await response.json();
    return {
      requestId: data.requestId,
      expiresIn: data.expiresIn,
      isNewUser: data.isNewUser,
    };
    
  } catch (error) {
    console.error('OTP request failed:', error);
    throw error;
  }
};

const verifyOTP = async (
  requestId: string,
  otp: string,
  userType: 'buyer' | 'customer'
) => {
  try {
    const endpoint = userType === 'buyer'
      ? '/auth/buyer/phone/verify'
      : '/auth/customer/otp/verify';
      
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
        otp,
        // Add additional fields for first-time users if needed
      }),
    });

    const data = await response.json();
    return {
      token: data.access_token,
      user: data.user,
    };
    
  } catch (error) {
    console.error('OTP verification failed:', error);
    throw error;
  }
};
\`\`\`

## Security Recommendations

### 1. OTP Security
- Use secure random number generation for OTP
- Implement rate limiting per phone number
- Set appropriate expiry times (5-10 minutes)
- Limit maximum attempts (3-5 attempts)
- Implement cooldown period after failed attempts
- Never send OTP in error messages or logs
- Use secure SMS gateway with delivery confirmation

### 2. SSO Security
- Validate email domains for business accounts
- Verify token signature and expiry
- Check token audience and issuer
- Implement state parameter to prevent CSRF
- Use PKCE for additional security
- Keep client secrets secure
- Implement proper session management

### 3. Token Management
- Use short-lived JWT tokens (15-60 minutes)
- Implement refresh token rotation
- Store tokens securely (HttpOnly cookies)
- Clear tokens on logout
- Implement token blacklisting for revoked tokens

### 4. Rate Limiting
\`\`\`typescript
// Rate limiting middleware configuration
const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
  },
  otp: {
    request: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5, // limit each phone number to 5 OTP requests per day
    },
    verify: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 3, // limit each request ID to 3 verification attempts
    },
  },
  sso: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 SSO attempts per windowMs
  },
};
\`\`\`

### 5. Error Handling
- Use generic error messages
- Don't expose internal details
- Log security events
- Implement proper monitoring
- Set up alerts for suspicious activities

### 6. Additional Security Measures
- Implement device fingerprinting
- Use geolocation validation
- Add IP-based blocking
- Implement CAPTCHA for suspicious activities
- Monitor for brute force attempts 

## Server-Side Implementation

### 1. SSO Token Verification

\`\`\`typescript
// src/auth/services/sso.service.ts
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class SSOService {
  private googleClient: OAuth2Client;
  private appleJwksClient: jwksClient.JwksClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
    );

    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
    });
  }

  async verifyGoogleToken(token: string): Promise<any> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });
      
      const payload = ticket.getPayload();
      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async verifyMicrosoftToken(token: string): Promise<any> {
    try {
      const response = await fetch(
        \`https://graph.microsoft.com/v1.0/me\`,
        {
          headers: {
            Authorization: \`Bearer \${token}\`,
          },
        },
      );
      
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      
      const data = await response.json();
      return {
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Microsoft token');
    }
  }

  async verifyAppleToken(token: string): Promise<any> {
    try {
      const decodedToken = jwt.decode(token, { complete: true });
      const kid = decodedToken.header.kid;
      
      const key = await this.appleJwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();
      
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: this.configService.get('APPLE_CLIENT_ID'),
        issuer: 'https://appleid.apple.com',
      });
      
      return {
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Apple token');
    }
  }
}
\`\`\`

### 2. OTP Generation and Storage

\`\`\`typescript
// src/auth/services/otp.service.ts
import { Redis } from 'ioredis';
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class OTPService {
  constructor(
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  private generateOTP(): string {
    return randomBytes(3)
      .readUIntBE(0, 3)
      .toString()
      .padStart(6, '0')
      .slice(-6);
  }

  private generateRequestId(): string {
    return randomBytes(32).toString('hex');
  }

  private getOTPKey(requestId: string): string {
    return \`otp:\${requestId}\`;
  }

  private getPhoneKey(phone: string): string {
    return \`phone:\${phone}\`;
  }

  async createOTP(phone: string): Promise<{ requestId: string; otp: string }> {
    // Check rate limit
    const attempts = await this.redis.incr(this.getPhoneKey(phone));
    if (attempts === 1) {
      await this.redis.expire(this.getPhoneKey(phone), 24 * 60 * 60); // 24 hours
    }
    
    if (attempts > 5) {
      throw new TooManyRequestsException('Too many OTP requests');
    }

    const otp = this.generateOTP();
    const requestId = this.generateRequestId();
    const hash = this.hashOTP(otp);

    // Store hashed OTP with expiry
    await this.redis.setex(
      this.getOTPKey(requestId),
      300, // 5 minutes
      JSON.stringify({
        hash,
        phone,
        attempts: 0,
      }),
    );

    return { requestId, otp };
  }

  private hashOTP(otp: string): string {
    return createHmac('sha256', this.configService.get('OTP_SECRET'))
      .update(otp)
      .digest('hex');
  }

  async verifyOTP(requestId: string, otp: string): Promise<boolean> {
    const key = this.getOTPKey(requestId);
    const data = await this.redis.get(key);
    
    if (!data) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const { hash, attempts, phone } = JSON.parse(data);
    
    // Check attempts
    if (attempts >= 3) {
      await this.redis.del(key);
      throw new TooManyRequestsException('Too many verification attempts');
    }

    // Update attempts
    await this.redis.set(
      key,
      JSON.stringify({
        hash,
        phone,
        attempts: attempts + 1,
      }),
      'KEEPTTL',
    );

    // Verify OTP
    const inputHash = this.hashOTP(otp);
    return hash === inputHash;
  }
}
\`\`\`

### 3. SMS Gateway Integration

\`\`\`typescript
// src/auth/services/sms.service.ts
import { Twilio } from 'twilio';
import { SNS } from 'aws-sdk';
import { MessageBird } from 'messagebird';

@Injectable()
export class SMSService {
  private twilioClient: Twilio;
  private snsClient: SNS;
  private messageBirdClient: MessageBird;

  constructor(private configService: ConfigService) {
    // Initialize SMS providers
    this.twilioClient = new Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );

    this.snsClient = new SNS({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });

    this.messageBirdClient = new MessageBird(
      this.configService.get('MESSAGEBIRD_API_KEY'),
    );
  }

  async sendSMS(
    phone: string,
    message: string,
    provider: 'twilio' | 'sns' | 'messagebird' = 'twilio',
  ): Promise<boolean> {
    try {
      switch (provider) {
        case 'twilio':
          await this.sendViaTwilio(phone, message);
          break;
        case 'sns':
          await this.sendViaSNS(phone, message);
          break;
        case 'messagebird':
          await this.sendViaMessageBird(phone, message);
          break;
      }
      return true;
    } catch (error) {
      // Log error and try fallback provider
      console.error(\`SMS sending failed via \${provider}:\`, error);
      return this.tryFallbackProvider(phone, message, provider);
    }
  }

  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    await this.twilioClient.messages.create({
      body: message,
      to: phone,
      from: this.configService.get('TWILIO_PHONE_NUMBER'),
    });
  }

  private async sendViaSNS(phone: string, message: string): Promise<void> {
    await this.snsClient
      .publish({
        Message: message,
        PhoneNumber: phone,
      })
      .promise();
  }

  private async sendViaMessageBird(phone: string, message: string): Promise<void> {
    await new Promise((resolve, reject) => {
      this.messageBirdClient.messages.create(
        {
          originator: 'YourApp',
          recipients: [phone],
          body: message,
        },
        (err, response) => {
          if (err) reject(err);
          else resolve(response);
        },
      );
    });
  }

  private async tryFallbackProvider(
    phone: string,
    message: string,
    failedProvider: string,
  ): Promise<boolean> {
    const providers = ['twilio', 'sns', 'messagebird'].filter(
      p => p !== failedProvider,
    );

    for (const provider of providers) {
      try {
        await this.sendSMS(phone, message, provider as any);
        return true;
      } catch (error) {
        console.error(\`Fallback SMS sending failed via \${provider}:\`, error);
      }
    }

    throw new ServiceUnavailableException('SMS service unavailable');
  }
}
\`\`\`

### 4. Authentication Controller

\`\`\`typescript
// src/auth/controllers/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private readonly otpService: OTPService,
    private readonly smsService: SMSService,
    private readonly ssoService: SSOService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('buyer/sso/email')
  async buyerSSOLogin(@Body() body: SSOLoginDto) {
    let userData;

    switch (body.provider) {
      case 'GOOGLE':
        userData = await this.ssoService.verifyGoogleToken(body.token);
        break;
      case 'MICROSOFT':
        userData = await this.ssoService.verifyMicrosoftToken(body.token);
        break;
      case 'APPLE':
        userData = await this.ssoService.verifyAppleToken(body.token);
        break;
      default:
        throw new BadRequestException('Invalid provider');
    }

    let user = await this.usersService.findByEmail(userData.email);
    
    if (!user) {
      user = await this.usersService.createBuyer({
        email: userData.email,
        name: userData.name,
        type: 'buyer',
      });
    }

    return {
      access_token: this.jwtService.sign({ sub: user.id, type: user.type }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
      },
    };
  }

  @Post('customer/otp/request')
  async customerOTPRequest(@Body() body: RequestOTPDto) {
    // Validate phone number
    if (!validatePhoneNumber(body.mobileNumber)) {
      throw new BadRequestException('Invalid phone number');
    }

    // Generate OTP
    const { requestId, otp } = await this.otpService.createOTP(body.mobileNumber);

    // Send OTP via SMS
    await this.smsService.sendSMS(
      body.mobileNumber,
      \`Your verification code is: \${otp}. Valid for 5 minutes.\`,
    );

    return {
      requestId,
      expiresIn: 300,
      isNewUser: !(await this.usersService.findByPhone(body.mobileNumber)),
    };
  }

  @Post('customer/otp/verify')
  async customerOTPVerify(@Body() body: VerifyOTPDto) {
    const isValid = await this.otpService.verifyOTP(body.requestId, body.otp);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const otpData = await this.otpService.getOTPData(body.requestId);
    let user = await this.usersService.findByPhone(otpData.phone);

    if (!user && !body.name) {
      throw new BadRequestException('Name required for new user');
    }

    if (!user) {
      user = await this.usersService.createCustomer({
        mobileNumber: otpData.phone,
        name: body.name,
        farmLat: body.farmLat,
        farmLng: body.farmLng,
        type: 'customer',
      });
    }

    return {
      access_token: this.jwtService.sign({ sub: user.id, type: user.type }),
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        type: user.type,
        farmLocation: {
          lat: user.farmLat,
          lng: user.farmLng,
        },
      },
    };
  }
}
\`\`\`

### 5. Unit Tests

\`\`\`typescript
// src/auth/services/otp.service.spec.ts
describe('OTPService', () => {
  let service: OTPService;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OTPService,
        {
          provide: Redis,
          useValue: {
            setex: jest.fn(),
            get: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<OTPService>(OTPService);
    redis = module.get<Redis>(Redis);
  });

  describe('createOTP', () => {
    it('should create OTP and return requestId', async () => {
      jest.spyOn(redis, 'incr').mockResolvedValue(1);
      
      const result = await service.createOTP('+1234567890');
      
      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('otp');
      expect(result.otp).toHaveLength(6);
    });

    it('should throw error on rate limit exceeded', async () => {
      jest.spyOn(redis, 'incr').mockResolvedValue(6);
      
      await expect(service.createOTP('+1234567890')).rejects.toThrow(
        TooManyRequestsException,
      );
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP', async () => {
      const mockOTP = '123456';
      const mockRequestId = 'test-id';
      const mockHash = service['hashOTP'](mockOTP);
      
      jest.spyOn(redis, 'get').mockResolvedValue(
        JSON.stringify({
          hash: mockHash,
          phone: '+1234567890',
          attempts: 0,
        }),
      );

      const result = await service.verifyOTP(mockRequestId, mockOTP);
      expect(result).toBe(true);
    });

    it('should throw error on invalid OTP', async () => {
      const mockOTP = '123456';
      const mockRequestId = 'test-id';
      const mockHash = service['hashOTP']('different-otp');
      
      jest.spyOn(redis, 'get').mockResolvedValue(
        JSON.stringify({
          hash: mockHash,
          phone: '+1234567890',
          attempts: 0,
        }),
      );

      const result = await service.verifyOTP(mockRequestId, mockOTP);
      expect(result).toBe(false);
    });
  });
});
\`\`\` 