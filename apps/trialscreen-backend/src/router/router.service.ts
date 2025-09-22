import { Injectable, OnModuleInit } from '@nestjs/common';
import { TrpcService } from 'src/trpc/trpc.service';
import { UserService } from 'src/user/user.service';
import { TrialService } from 'src/trial/trial.service';
import { z } from 'zod';
import { CreateUserDto } from 'src/user/user.interface';

@Injectable()
export class RouterService implements OnModuleInit {
  public appRouter: any;

  constructor(
    private readonly trpc: TrpcService,
    private readonly userService: UserService,
    private readonly trialService: TrialService,
  ) {}

  onModuleInit() {
    this.appRouter = this.trpc.router({
      user: this.trpc.router({
        create: this.trpc.procedure
          .input(z.object({ email: z.string().email(), password: z.string() }))
          .mutation(async ({ input }) => {
            const newUser: CreateUserDto = {
              email: input.email,
              password: input.password,
            };
            return await this.userService.create(newUser);
          }),
        findByEmail: this.trpc.procedure
          .input(z.object({ email: z.string().email() }))
          .query(async ({ input }) => {
            return await this.userService.findByEmail(input.email);
          }),
      }),
      trial: this.trpc.router({
        create: this.trpc.procedure
          .input(
            z.object({
              title: z.string(),
              description: z.string(),
              inclusion_criteria: z.array(z.string()),
              exclusion_criteria: z.array(z.string()),
            }),
          )
          .mutation(async ({ input }) => {
            const createdTrial = await this.trialService.create(input);
            return createdTrial;
          }),
        getAll: this.trpc.procedure.query(async () => {
          return await this.trialService.getAll();
        }),
      }),
    });
  }
}
