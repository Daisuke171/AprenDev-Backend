import {IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  lastname: string;

  @IsString()
  dni: string;

  @IsString()
  birthday: string;

  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  password: string;

  @IsString()
  confirmPassword: string;
}
