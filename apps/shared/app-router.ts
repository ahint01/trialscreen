import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { RouterService } from '../trialscreen-backend/src/router/router.service';

export type AppRouter = typeof RouterService.prototype.appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;