import { IsString, IsOptional } from 'class-validator';

export class RevocarTokenDto {
  @IsString()
  @IsOptional()
  token?: string;

  @IsString()
  @IsOptional()
  motivo?: string;
}
