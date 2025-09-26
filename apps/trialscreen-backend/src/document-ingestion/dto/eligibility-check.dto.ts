import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class EligibilityCheckDto {
  @IsString()
  @IsNotEmpty()
  fileBuffer: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  inclusionCriteria: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  exclusionCriteria: string[];
}
