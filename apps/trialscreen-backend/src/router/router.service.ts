import { Injectable } from '@nestjs/common';
import { TrpcService } from 'src/trpc/trpc.service';
import { UserService } from 'src/user/user.service';
import { TrialService } from 'src/trial/trial.service';
import { AuthService } from 'src/auth/auth.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { CreateUserDto } from 'src/user/user.interface';
import { Trial } from 'src/trial/trial.interface';

@Injectable()
export class RouterService {
  public readonly appRouter;

  constructor(
    private readonly trpc: TrpcService,
    private readonly userService: UserService,
    private readonly trialService: TrialService,
    private readonly authService: AuthService,
  ) {
    const authRouter = this.trpc.router({
      signup: this.trpc.procedure
        .input(z.object({ email: z.string().email(), password: z.string() }))
        .mutation(async ({ input }) => {
          const newUser: CreateUserDto = {
            email: input.email,
            password: input.password,
          };
          const createdUser = await this.userService.create(newUser);
          return this.authService.login(createdUser);
        }),
      login: this.trpc.procedure
        .input(z.object({ email: z.string().email(), password: z.string() }))
        .mutation(async ({ input }) => {
          const user = await this.authService.validateUser(
            input.email,
            input.password,
          );
          if (!user) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid credentials',
            });
          }
          return this.authService.login(user);
        }),
    });

    const userRouter = this.trpc.router({
      findByEmail: this.trpc.procedure
        .input(z.object({ email: z.string().email() }))
        .query(async ({ input }) => {
          return await this.userService.findByEmail(input.email);
        }),
    });

    const trialRouter = this.trpc.router({
      create: this.trpc.protectedProcedure
        .input(
          z.object({
            title: z.string(),
            description: z.string(),
            inclusion_criteria: z.array(z.string()),
            exclusion_criteria: z.array(z.string()),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          const createdTrial: Trial = await this.trialService.create({
            ...input,
            user_id: ctx.user.id,
          });
          return createdTrial;
        }),
      findAll: this.trpc.protectedProcedure.query(async ({ ctx }) => {
        return await this.trialService.findAll(ctx.user.id);
      }),
    });

    this.appRouter = this.trpc.router({
      authRouter: authRouter,
      userRouter: userRouter,
      trialRouter: trialRouter,
    });
  }
}
