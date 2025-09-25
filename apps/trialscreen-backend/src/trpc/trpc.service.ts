import { INestApplication, Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { initTRPC, TRPCError } from '@trpc/server';
import { AuthService } from 'src/auth/auth.service';
import type { User } from 'src/user/user.interface';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

// Define the type for an authenticated user, omitting the password hash
type AuthenticatedUser = Omit<User, 'password_hash'>;

// Define a new context type that is guaranteed to have a user
interface Context {
  user?: AuthenticatedUser;
}

@Injectable()
export class TrpcService {
  constructor(private readonly authService: AuthService) {}

  // We are creating a context that includes an optional user
  trpc = initTRPC.context<Context>().create();
  procedure = this.trpc.procedure;
  router = this.trpc.router;

  private isAuthed = this.trpc.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }
    return next({
      ctx: {
        // Here we are creating a new context with a non-optional user
        user: ctx.user,
      },
    });
  });

  // This is the correct way to declare the protected procedure.
  // We simply chain the middleware.
  public protectedProcedure = this.procedure.use(this.isAuthed);

  // This method is correctly called by main.ts and returns the tRPC context.
  createContext({ req, res, info }: CreateExpressContextOptions) {
    // In a NestJS app, the user is typically attached to the request object by a Passport strategy.
    const user = (req as any).user as AuthenticatedUser;
    return { req, res, info, user };
  }

  // We are now directly using the TrpcExpressContext which already contains `req` and `res`
  applyMiddleware(app: INestApplication, router: any) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router,
        createContext: (opts) => {
          const user = (opts.req as any).user as AuthenticatedUser;
          return { user };
        },
      }),
    );
  }
}
