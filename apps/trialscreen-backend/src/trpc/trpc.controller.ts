import { Controller, Req, Res, All, Next } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcService } from './trpc.service';
import { RouterService } from '../router/router.service';
import type { NextFunction, Request, Response } from 'express';

@Controller('trpc')
export class TrpcController {
  private trpcExpressHandler:
    | ReturnType<typeof trpcExpress.createExpressMiddleware>
    | undefined;

  constructor(
    private readonly trpcService: TrpcService,
    private readonly routerService: RouterService,
  ) {}

  @All(['*', '/*'])
  async handleRequests(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    if (!this.trpcExpressHandler) {
      this.trpcExpressHandler = trpcExpress.createExpressMiddleware({
        router: this.routerService.appRouter,
        createContext: ({ req, res }) =>
          this.trpcService.createContext({ req, res }),
      });
    }

    await this.trpcExpressHandler(req, res, next);
  }
}
