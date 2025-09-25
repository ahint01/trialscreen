import { Controller, Get, Post, Body, Req, Param } from '@nestjs/common';
import { TrialService } from './trial.service';
import { Trial } from './trial.interface';
import type { AuthRequest } from './trial.interface';
import { CreateTrialDto } from './dto/create-trial.dto';

@Controller('trial')
export class TrialController {
  constructor(private readonly trialService: TrialService) {}

  /**
   * Creates a new trial for the authenticated user.
   * @param createTrialDto The data for the new trial.
   * @param req The request object, used to get the user ID.
   * @returns The newly created trial.
   */
  @Post()
  async create(
    @Body() createTrialDto: CreateTrialDto,
    @Req() req: AuthRequest,
  ): Promise<Trial> {
    const userId = req.user?.id || 'mock-user-id';
    return this.trialService.create({
      ...createTrialDto,
      user_id: userId,
    });
  }

  /**
   * Retrieves all trials for the authenticated user.
   * @param req The request object, used to get the user ID.
   * @returns An array of trials owned by the user.
   */
  @Get()
  async findAll(@Req() req: AuthRequest): Promise<Trial[]> {
    const userId = req.user?.id || 'mock-user-id';
    return this.trialService.findAll(userId);
  }

  /**
   * Retrieves a single trial by its ID.
   * @param id The ID of the trial to retrieve.
   * @param req The request object, used to get the user ID.
   * @returns The requested trial, or null if not found.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Trial | null> {
    const userId = req.user?.id || 'mock-user-id';
    return this.trialService.findOne(id, userId);
  }
}
