import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcService } from './trpc/trpc.service';
import { RouterService } from './router/router.service';
import * as trpcExpress from '@trpc/server/adapters/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend requests
  app.enableCors({
    origin: '*', // Be more restrictive in production
    credentials: true,
  });

  // Get the TrpcService and RouterService from the app context
  const trpcService = app.get(TrpcService);
  const routerService = app.get(RouterService);

  // Ensure the onModuleInit hook has run
  await app.init();

  // Create the tRPC Express handler
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: routerService.appRouter,
      createContext: ({ req, res }) => trpcService.createContext({ req, res }),
    }),
  );

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
