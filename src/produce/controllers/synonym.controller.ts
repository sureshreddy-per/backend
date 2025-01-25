import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Delete,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProduceSynonymService } from "../services/synonym.service";
import { Synonym } from "../entities/synonym.entity";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { IsNotEmpty, IsString, IsArray, IsBoolean, IsOptional } from "class-validator";

class AddSynonymDto {
  @IsNotEmpty()
  @IsString()
  canonical_name: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  synonyms: string[];

  @IsOptional()
  @IsString()
  language?: string;
}

class ValidateSynonymDto {
  @IsNotEmpty()
  @IsString()
  produce_name: string;

  @IsNotEmpty()
  @IsString()
  synonym: string;

  @IsNotEmpty()
  @IsBoolean()
  is_valid: boolean;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsString()
  market_context?: string;
}

@ApiTags("Produce Synonyms")
@Controller("produce-synonyms")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class ProduceSynonymController {
  constructor(private readonly synonymService: ProduceSynonymService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add synonyms for a produce name' })
  @ApiResponse({
    status: 201,
    description: "Synonyms added successfully",
    type: Synonym,
  })
  async addSynonyms(
    @Body() dto: AddSynonymDto,
    @Request() req: any,
  ): Promise<void> {
    return this.synonymService.addSynonyms(
      dto.canonical_name,
      dto.synonyms,
      dto.language,
    );
  }

  @Get("search")
  @ApiOperation({ summary: "Search produce synonyms" })
  @ApiResponse({
    status: 200,
    description: "Returns list of matching canonical names",
    type: [String],
  })
  async searchSynonyms(@Query("query") query: string): Promise<string[]> {
    return this.synonymService.searchSynonyms(query);
  }

  @Get("canonical")
  @ApiOperation({ summary: "Find canonical name for a word" })
  @ApiResponse({
    status: 200,
    description: "Returns the canonical name if found",
    type: String,
  })
  async findCanonicalName(@Query("word") word: string): Promise<string | null> {
    return this.synonymService.findProduceName(word);
  }

  @Delete(":canonical_name")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Deactivate a synonym entry" })
  @ApiResponse({
    status: 200,
    description: "Synonym entry deactivated successfully",
  })
  async deactivateSynonym(
    @Param("canonical_name") canonical_name: string,
    @Request() req: any,
  ): Promise<void> {
    await this.synonymService.deactivateSynonym(canonical_name, req.user.id);
  }

  @Post("validate")
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate a synonym' })
  @ApiResponse({
    status: 201,
    description: "Synonym validation recorded successfully"
  })
  async validateSynonym(
    @Body() dto: ValidateSynonymDto,
    @Request() req: any,
  ): Promise<void> {
    return this.synonymService.validateSynonymByUser(
      dto.produce_name,
      dto.synonym,
      dto.is_valid,
      {
        region: dto.region,
        season: dto.season,
        market_context: dto.market_context
      }
    );
  }

  @Get("stats")
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get synonym statistics' })
  @ApiResponse({
    status: 200,
    description: "Returns synonym statistics"
  })
  async getSynonymStats() {
    return this.synonymService.getSynonymStats();
  }

  @Get("needs-validation")
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FARMER)
  @ApiOperation({ summary: 'Get synonyms that need validation' })
  @ApiResponse({
    status: 200,
    description: "Returns synonyms needing validation",
    type: [Synonym]
  })
  async getSynonymsNeedingValidation(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0
  ) {
    const query = this.synonymService.createQueryBuilder('synonym')
      .where('synonym.is_active = :isActive', { isActive: true })
      .andWhere('synonym.validation_count < :minValidations', { minValidations: 3 })
      .orderBy('synonym.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    return query.getMany();
  }
}
