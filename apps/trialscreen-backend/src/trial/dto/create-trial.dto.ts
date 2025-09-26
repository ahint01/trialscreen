import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateTrialDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  inclusion_criteria: string[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  exclusion_criteria: string[];
}
