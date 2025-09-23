import { IsNotEmpty, IsArray, IsString } from 'class-validator';

/**
 * Data Transfer Object for the eligibility check request.
 * Contains the inclusion and exclusion criteria provided by the user.
 */
export class EligibilityCheckDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsNotEmpty()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsArray()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString({ each: true })
  inclusionCriteria: string[];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsNotEmpty()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsArray()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString({ each: true })
  exclusionCriteria: string[];
}
