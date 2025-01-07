import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produce } from '../entities/produce.entity';
import { BaseService } from '../../common/base.service';

@Injectable()
export class ProduceService extends BaseService<Produce> {
  constructor(
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>
  ) {
    super(produceRepository);
  }
} 