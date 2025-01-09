import { Controller, Post, Get, Body, Query, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProduceSynonymService } from '../services/synonym.service';
import { ProduceSynonym } from '../entities/synonym.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

class AddSynonymDto {
  canonical_name: string;
  words: string[];
  translations?: Record<string, string>;
}

@ApiTags('Produce Synonyms')
@Controller('produce-synonyms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProduceSynonymController {
  constructor(private readonly synonymService: ProduceSynonymService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add new synonyms for a produce name' })
  @ApiResponse({
    status: 201,
    description: 'Synonyms added successfully',
    type: ProduceSynonym
  })
  async addSynonyms(
    @Body() dto: AddSynonymDto,
    @Request() req: any
  ): Promise<ProduceSynonym> {
    return this.synonymService.addSynonyms(
      dto.canonical_name,
      dto.words,
      dto.translations,
      req.user.id
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search produce synonyms' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of matching canonical names',
    type: [String]
  })
  async searchSynonyms(
    @Query('query') query: string
  ): Promise<string[]> {
    return this.synonymService.searchSynonyms(query);
  }

  @Get('canonical')
  @ApiOperation({ summary: 'Find canonical name for a word' })
  @ApiResponse({
    status: 200,
    description: 'Returns the canonical name if found',
    type: String
  })
  async findCanonicalName(
    @Query('word') word: string
  ): Promise<string | null> {
    return this.synonymService.findCanonicalName(word);
  }

  @Delete(':canonicalName')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a synonym entry' })
  @ApiResponse({
    status: 200,
    description: 'Synonym entry deactivated successfully'
  })
  async deactivateSynonym(
    @Param('canonicalName') canonicalName: string,
    @Request() req: any
  ): Promise<void> {
    await this.synonymService.deactivateSynonym(canonicalName, req.user.id);
  }
} 