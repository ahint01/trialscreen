// trialscreen-backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RouterService } from './router/router.service';
import { TrpcService } from './trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import * as passport from 'passport'; // 1. Import Passport
import * as express from 'express'; // 2. Import Express (for custom middleware)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Get the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance(); 

  // --- START: Authentication Middleware Injection ---

  // 1. Initialize Passport
  expressApp.use(passport.initialize());

  // 2. Custom middleware to execute the 'jwt' strategy on protected routes (like /trpc).
  // This middleware attempts to authenticate the request using the 'jwt' strategy.
  // The strategy (JwtStrategy) will extract the token, validate it, and attach the
  // result (the user object) to req.user. We use a function that only attempts to auth
  // but doesn't throw if the token is missing, as unauthenticated tRPC procedures 
  // (like login/signup) need to pass through.
  expressApp.use('/trpc', (req, res, next) => {
    // passport.authenticate returns an Express handler.
    // We execute it, setting session to false (stateless API).
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (user) {
        // If authentication succeeds, attach the user for tRPC context
        (req as any).user = user; 
      }
      // Regardless of success/failure, proceed to the next middleware (the tRPC handler)
      next(); 
    })(req, res, next);
  });
  
  // --- END: Authentication Middleware Injection ---

  app.enableCors(); // Ensure CORS is enabled

  const routerService = app.get(RouterService);
  const trpcService = app.get(TrpcService);
  
  // The tRPC middleware now runs AFTER the JWT middleware
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: routerService.appRouter,
      // trpcService.createContext will now correctly find (req as any).user
      createContext: ({ req, res, info }) =>
        trpcService.createContext({ req, res, info }),
    }),
  );
  
  await app.listen(3000);
  console.log('Application listening on port 3000');
}
bootstrap();