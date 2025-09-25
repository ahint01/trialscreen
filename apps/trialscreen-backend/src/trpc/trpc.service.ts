import { Injectable } from '@nestjs/common';
import { type INestApplication } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { initTRPC, TRPCError } from '@trpc/server';
import { AuthService } from 'src/auth/auth.service';
import type { User } from 'src/user/user.interface';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

// Define the type for an authenticated user, omitting the password hash
type AuthenticatedUser = Omit<User, 'password_hash'>;

// Define a new context type that is guaranteed to have a user
interface Context {
  user?: AuthenticatedUser;
}

@Injectable()
export class TrpcService {
  constructor(private readonly authService: AuthService) {}

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

  public protectedProcedure = this.procedure.use(this.isAuthed);

  // This method is now our single source of truth for creating a tRPC context.
  // It manually extracts the JWT token from the headers and validates it.
  createContext({ req }: CreateExpressContextOptions): Context {
    try {
      // Get the Authorization header and extract the token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {}; // Return a context without a user if no token is found
      }
      const token = authHeader.split(' ')[1];

      // Validate the token and get the user payload
      const user = this.authService.validateToken(token);

      // Return the context with the authenticated user
      return { user };
    } catch (error) {
      // If validation fails, return a context without a user and log the error.
      console.error('Error validating token:', error);
      return {};
    }
  }

  // We are now directly using the TrpcExpressContext which already contains `req` and `res`
  applyMiddleware(app: INestApplication, router: any) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createContext: this.createContext.bind(this),
      }),
    );
  }
}
