import { Module } from '@nestjs/common';
import Knex from 'knex';
import config from '../../knexconfig';

const knexProvider = {
  provide: 'KNEX_CONNECTION',
  useFactory: () => {
    return Knex(config);
  },
};

@Module({
  providers: [knexProvider],
  exports: [knexProvider],
})
export class DatabaseModule {}
