import { Controller, Get, Post, Req, Res, Next } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { NextFunction } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcService } from './trpc.service';
import { RouterService } from '../router/router.service';

@Controller('trpc')
export class TrpcController {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly routerService: RouterService,
  ) {}

  @Get('*')
  @Post('*')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    const handler = trpcExpress.createExpressMiddleware({
      router: this.routerService.appRouter,
      createContext: ({ req, res }) => {
        const user = { id: 'some-user-id', email: 'test@example.com' };
        return { req, res, user };
      },
    });

    await handler(req, res, next);
  }
}
