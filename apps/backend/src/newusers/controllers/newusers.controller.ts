import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { NewUsersService } from '../services/newusers.service.js';
import { RegisterSolicitanteDto } from '../dto/index.js';

@Controller('api/v1/newusers')
export class NewUsersController {
  constructor(private readonly newUsersService: NewUsersService) {}

  /**
   * Auto-registro público desde la pestaña "¿eres nuevo?" del Login.
   * Crea exclusivamente usuarios con el rol de Solicitante (rolId = 1).
   */
  @Post('register')
  @HttpCode(201)
  async registrarSolicitante(@Body() dto: RegisterSolicitanteDto) {
    return await this.newUsersService.registrarSolicitante(dto);
  }
}

