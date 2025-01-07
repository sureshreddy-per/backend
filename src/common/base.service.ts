import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial, ObjectLiteral } from 'typeorm';

export class BaseService<T extends { id: string }> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.repository.findAndCount(options);
  }

  async findOne(options: FindManyOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.repository.update({ id } as FindOptionsWhere<T>, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }
} 