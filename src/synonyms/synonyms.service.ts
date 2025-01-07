import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Synonym } from './entities/synonym.entity';
import { CreateSynonymDto } from './dto/create-synonym.dto';
import { UpdateSynonymDto } from './dto/update-synonym.dto';

@Injectable()
export class SynonymsService {
  constructor(
    @InjectRepository(Synonym)
    private readonly synonymRepository: Repository<Synonym>,
  ) {}

  async create(createSynonymDto: CreateSynonymDto): Promise<Synonym> {
    const synonym = this.synonymRepository.create(createSynonymDto);
    return this.synonymRepository.save(synonym);
  }

  async findAll(): Promise<Synonym[]> {
    return this.synonymRepository.find({
      order: { updated_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Synonym> {
    const synonym = await this.synonymRepository.findOne({
      where: { id }
    });
    if (!synonym) {
      throw new NotFoundException(`Synonym with ID ${id} not found`);
    }
    return synonym;
  }

  async findByName(name: string): Promise<Synonym> {
    const synonym = await this.synonymRepository.findOne({
      where: { name }
    });
    if (!synonym) {
      throw new NotFoundException(`Synonym with name ${name} not found`);
    }
    return synonym;
  }

  async update(id: string, updateSynonymDto: UpdateSynonymDto): Promise<Synonym> {
    const synonym = await this.findOne(id);
    Object.assign(synonym, updateSynonymDto);
    return this.synonymRepository.save(synonym);
  }

  async remove(id: string): Promise<void> {
    const synonym = await this.findOne(id);
    await this.synonymRepository.remove(synonym);
  }

  async addWord(id: string, word: string): Promise<Synonym> {
    const synonym = await this.findOne(id);
    const words = synonym.words as string[];
    if (!words.includes(word)) {
      words.push(word);
      synonym.words = words;
      return this.synonymRepository.save(synonym);
    }
    return synonym;
  }

  async removeWord(id: string, word: string): Promise<Synonym> {
    const synonym = await this.findOne(id);
    const words = synonym.words as string[];
    const index = words.indexOf(word);
    if (index > -1) {
      words.splice(index, 1);
      synonym.words = words;
      return this.synonymRepository.save(synonym);
    }
    return synonym;
  }

  async search(query: string): Promise<Synonym[]> {
    const synonyms = await this.findAll();
    return synonyms.filter(synonym => {
      const words = synonym.words as string[];
      return words.some(word => word.toLowerCase().includes(query.toLowerCase()));
    });
  }
} 