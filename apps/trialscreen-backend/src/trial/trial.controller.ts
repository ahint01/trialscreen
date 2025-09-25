import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  Param,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
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
   * Updates an existing trial for the authenticated user.
   * @param id The ID of the trial to update.
   * @param updatedTrialDto The updated trial data.
   * @param req The request object, used to get the user ID.
   * @returns The updated trial.
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatedTrialDto: Partial<Trial>,
    @Req() req: AuthRequest,
  ): Promise<Trial> {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException(
        'Authentication required to update a trial.',
      );
    }
    const userId = req.user.id;

    // 1. Check if the trial exists AND belongs to the user
    const existingTrial = await this.trialService.findOne(id, userId);

    if (!existingTrial) {
      // Return NotFoundException, as the trial ID doesn't exist for this user
      throw new NotFoundException('Trial not found.');
    }

    // 2. Perform the update (since we've confirmed ownership)
    const updatedTrial = await this.trialService.update(id, updatedTrialDto);

    // This check should technically be redundant if the trial was found, but is good for safety.
    if (!updatedTrial) {
      throw new NotFoundException('Trial not found.');
    }

    return updatedTrial;
  }

  /**
   * Retrieves all trials for the authenticated user.
   * @param req The request object, used to get the user ID.
   * @returns An array of trials owned by the user.
   */
  @Get()
  async findAll(@Req() req: AuthRequest): Promise<Trial[]> {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException(
        'Authentication required to view trials.',
      );
    }
    const userId = req.user.id;
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
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException(
        'Authentication required to view trials.',
      );
    }

    const userId = req.user.id;
    return this.trialService.findOne(id, userId);
  }
}
