import { Module } from '@nestjs/common';
import Knex from 'knex';
import config from '../../knexfile';

const knexProvider = {
  provide: 'KNEX_CONNECTION',
  useFactory: () => {
    const environment = process.env.NODE_ENV || 'development';
    return Knex(config[environment]);
  },
};

@Module({
  providers: [knexProvider],
  exports: [knexProvider],
})
export class DatabaseModule {}
