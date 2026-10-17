import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadDocumentDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'El tipo documental es obligatorio' })
  @MaxLength(100)
  tipoDocumental: string;
}
