import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, VerificationStatus } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<{ user: User; token: string }> {
    const { password, ...userData } = registerUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersRepository.save({
      ...userData,
      passwordHash,
      verificationStatus: VerificationStatus.PENDING,
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

    return response;
  }

  async login(loginUserDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginUserDto;

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

    return response;
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    delete user.passwordHash;
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
    };

    return this.jwtService.sign(payload);
  }
} 