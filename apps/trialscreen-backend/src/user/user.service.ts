import { Inject, Injectable } from '@nestjs/common';
import type { Knex } from 'knex';
import { type User, CreateUserDto } from './user.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  public readonly knex: Knex;
  constructor(@Inject('KNEX_CONNECTION') connection: Knex) {
    this.knex = connection;
  }

  async create(user: CreateUserDto): Promise<User> {
    const password_hash = await bcrypt.hash(user.password, 10);

    const [createdUser] = (await this.knex('user')
      .insert({ email: user.email, password_hash })
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
