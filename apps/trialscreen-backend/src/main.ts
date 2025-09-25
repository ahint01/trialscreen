import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RouterService } from './router/router.service';
import { TrpcService } from './trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Get the services from the app module to access the router
  const routerService = app.get(RouterService);
  const trpcService = app.get(TrpcService);
  // We need to use app.use() to apply the tRPC middleware to the '/trpc' path
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: routerService.appRouter,
      createContext: ({ req, res, info }) =>
        trpcService.createContext({ req, res, info }),
    }),
  );
  await app.listen(3000);
  console.log('Application listening on port 3000');
}
bootstrap();
