import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
// Import the AppRouter type directly from the backend source
import type { RouterService } from '../../apps/trialscreen-backend/src/router/router.service';

// Re-export the type so the frontend can import it cleanly
export type  AppRouter = RouterService['appRouter']

// These types are now correctly inferred from the imported AppRouter type
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;