import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Not } from "typeorm";
import { Farmer } from "../entities/farmer.entity";
import { Farm } from "../entities/farm.entity";
import { BankAccount } from "../entities/bank-account.entity";
import { User } from "../../users/entities/user.entity";
import { Produce } from "../../produce/entities/produce.entity";
import { InspectionRequest } from "../../quality/entities/inspection-request.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";
import { TransactionStatus } from "../../transactions/entities/transaction.entity";
import { UpdateUserDetailsDto } from "../dto/update-user-details.dto";

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepository: Repository<Farmer>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(InspectionRequest)
    private readonly inspectionRequestRepository: Repository<InspectionRequest>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  private async getFarmerWithUser(
    farmer: Farmer,
  ): Promise<Farmer & { user: Partial<User>; total_produce_count: number; total_inspection_count: number; total_transactions_completed_count: number }> {
    const user = await this.userRepository.findOne({
      where: { id: farmer.user_id },
      select: [
        "id",
        "email",
        "avatar_url",
        "name",
        "status",
        "mobile_number",
        "role",
        "rating",
        "total_completed_transactions",
        "last_login_at",
        "app_version",
        "fcm_token"
      ],
    });

    if (!user) {
      throw new NotFoundException(
        `User details for farmer ${farmer.id} not found`,
      );
    }

    // Get total produce count
    const total_produce_count = await this.produceRepository.count({
      where: { farmer_id: farmer.id },
    });

    // Get total inspection count
    const total_inspection_count = await this.inspectionRequestRepository.count({
      where: { produce_id: In(
        await this.produceRepository
          .createQueryBuilder('produce')
          .select('produce.id')
          .where('produce.farmer_id = :farmerId', { farmerId: farmer.id })
          .getMany()
          .then(produces => produces.map(p => p.id))
      ) },
    });

    // Get total completed transactions count
    const total_transactions_completed_count = await this.transactionRepository.count({
      where: { 
        farmer_id: farmer.id,
        status: "COMPLETED" as TransactionStatus
      },
    });

    return { 
      ...farmer, 
      user,
      total_produce_count,
      total_inspection_count,
      total_transactions_completed_count
    };
  }

  async findByUserId(
    userId: string,
  ): Promise<Farmer & { user: Partial<User> }> {
    const farmer = await this.farmerRepository.findOne({
      where: { user_id: userId },
      relations: ["farms", "bank_accounts"],
    });
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${userId} not found`);
    }
    return this.getFarmerWithUser(farmer);
  }

  async updateUserDetails(
    userId: string,
    updateUserDetailsDto: UpdateUserDetailsDto,
  ): Promise<Farmer & { user: Partial<User> }> {
    // First check if the user exists and is a farmer
    const farmer = await this.findByUserId(userId);

    // Update user details
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate mobile number uniqueness if it's being updated
    if (updateUserDetailsDto.mobile_number) {
      const existingUser = await this.userRepository.findOne({
        where: { 
          mobile_number: updateUserDetailsDto.mobile_number,
          id: Not(userId) // Exclude current user
        }
      });
      if (existingUser) {
        throw new BadRequestException('Mobile number is already in use');
      }
    }

    // Validate email uniqueness if it's being updated
    if (updateUserDetailsDto.email) {
      const existingUser = await this.userRepository.findOne({
        where: { 
          email: updateUserDetailsDto.email,
          id: Not(userId) // Exclude current user
        }
      });
      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    // Only update the fields that are provided
    Object.assign(user, updateUserDetailsDto);

    // Save the updated user
    await this.userRepository.save(user);

    // Return the updated farmer with user details
    return this.getFarmerWithUser(farmer);
  }
} 
