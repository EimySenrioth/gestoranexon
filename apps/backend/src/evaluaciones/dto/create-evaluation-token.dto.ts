import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEvaluationTokenDto {
  @IsString()
  @IsNotEmpty()
  expedienteId!: string;
}
