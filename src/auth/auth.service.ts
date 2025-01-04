import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, VerificationStatus } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<{ user: User; token: string }> {
    const { password, email, ...userData } = registerUserDto;

    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate password strength
    if (!this.isPasswordStrong(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.usersRepository.save({
        ...userData,
        email,
        passwordHash,
        verificationStatus: VerificationStatus.PENDING,
        loginAttempts: 0,
        lastLoginAttempt: null,
      });

      const token = this.generateToken(user);

      const response = {
        user: {
          ...user,
          userId: user.id,
          isFarmer: user.isFarmer,
          isBuyer: user.isBuyer,
        },
        token,
      };

      delete response.user.passwordHash;
      delete response.user.loginAttempts;
      delete response.user.lastLoginAttempt;

      return response;
    } catch (error) {
      throw new BadRequestException('Failed to create user account');
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginUserDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (this.isAccountLocked(user)) {
      const remainingTime = this.getRemainingLockTime(user);
      throw new UnauthorizedException(
        `Account is temporarily locked. Try again in ${Math.ceil(remainingTime / 60000)} minutes`
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLoginAttempt(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked by administrator');
    }

    if (user.verificationStatus === VerificationStatus.PENDING) {
      throw new UnauthorizedException('Please verify your email address');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLoginAttempt = null;
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    const token = this.generateToken(user);

    const response = {
      user: {
        ...user,
        userId: user.id,
      },
      token,
    };

    delete response.user.passwordHash;
    delete response.user.loginAttempts;
    delete response.user.lastLoginAttempt;

    return response;
  }

  private isPasswordStrong(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  private isAccountLocked(user: User): boolean {
    if (!user.lastLoginAttempt || user.loginAttempts < this.MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    const lockoutEndTime = new Date(user.lastLoginAttempt.getTime() + this.LOCKOUT_DURATION);
    return lockoutEndTime > new Date();
  }

  private getRemainingLockTime(user: User): number {
    if (!user.lastLoginAttempt) {
      return 0;
    }

    const lockoutEndTime = new Date(user.lastLoginAttempt.getTime() + this.LOCKOUT_DURATION);
    const currentTime = new Date();
    return Math.max(0, lockoutEndTime.getTime() - currentTime.getTime());
  }

  private async handleFailedLoginAttempt(user: User): Promise<void> {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    user.lastLoginAttempt = new Date();
    await this.usersRepository.save(user);

    if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      throw new UnauthorizedException(
        `Account is temporarily locked due to too many failed attempts. Try again in ${
          this.LOCKOUT_DURATION / 60000
        } minutes`
      );
    }

    const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - user.loginAttempts;
    throw new UnauthorizedException(
      `Invalid credentials. ${remainingAttempts} attempts remaining before account lockout`
    );
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked by administrator');
    }

    if (user.verificationStatus === VerificationStatus.PENDING) {
      throw new UnauthorizedException('Please verify your email address');
    }

    delete user.passwordHash;
    delete user.loginAttempts;
    delete user.lastLoginAttempt;
    return user;
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    delete user.passwordHash;
    return user;
  }

  async blockUser(userId: string, reason: string): Promise<User> {
    const user = await this.validateUser(userId);

    user.isBlocked = true;
    user.blockReason = reason;

    const updatedUser = await this.usersRepository.save(user);
    delete updatedUser.passwordHash;

    return updatedUser;
  }

  async unblockUser(userId: string): Promise<User> {
    const user = await this.validateUser(userId);

    user.isBlocked = false;
    user.blockReason = null;

    const updatedUser = await this.usersRepository.save(user);
    delete updatedUser.passwordHash;

    return updatedUser;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    };
    return this.jwtService.sign(payload);
  }
} 