import { Inject, Injectable } from '@nestjs/common';
import type { Knex } from 'knex';
import { User, CreateUserDto } from './user.interface';

@Injectable()
export class UserService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async create(user: CreateUserDto): Promise<User> {
    const [createdUser] = (await this.knex('user')
      .insert(user)
      .returning('*')) as User[];
    return createdUser;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = (await this.knex('user').where({ email }).first()) as
      | User
      | undefined;
    return user;
  }
}
