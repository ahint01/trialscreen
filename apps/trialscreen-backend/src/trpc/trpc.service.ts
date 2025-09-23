import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { User } from 'src/user/user.interface';
import { AppRouter } from 'src/router/router.service';

type AuthenticatedUser = Omit<User, 'password_hash'>;

interface Context extends CreateExpressContextOptions {
  user?: AuthenticatedUser;
}

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create();
  procedure = this.trpc.procedure;
  router = this.trpc.router;

  protectedProcedure: typeof this.trpc.procedure = this.trpc.procedure.use(
    async (opts) => {
      if (!opts.ctx.user) {
        throw new Error('UNAUTHORIZED');
      }
      return opts.next({
        ctx: {
          ...opts.ctx,
          user: opts.ctx.user,
        },
      });
    },
  );

  createCallerFactory(appRouter: AppRouter) {
    return this.trpc.createCallerFactory(appRouter);
  }
}
