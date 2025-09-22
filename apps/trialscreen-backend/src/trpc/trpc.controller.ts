import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcService } from './trpc.service';
import { AppRouter } from './router.service';

@Controller('trpc')
export class TrpcController {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly appRouter: AppRouter,
  ) {}

  @Get('*')
  @Post('*')
  async handleRequest(@Req() req: Request, @Res() res: Response) {
    const handler = trpcExpress.createExpressMiddleware({
      router: this.appRouter,
      createContext: () => ({ req, res }),
    });

    await handler(req, res);
  }
}