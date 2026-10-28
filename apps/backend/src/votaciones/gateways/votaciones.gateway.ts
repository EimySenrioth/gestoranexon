import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { VotacionesService } from '../services/votaciones.service.js';
import { EmitirVotoDto, EmitirDictamenPresidenteDto } from '../dto/index.js';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/votaciones' })
export class VotacionesGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VotacionesGateway.name);

  constructor(private readonly votacionesService: VotacionesService) {}

  /**
   * Evaluador o presidente se conecta a la sala de la sesión de votación.
   */
  @SubscribeMessage('unirseASesion')
  async handleUnirse(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sesionId: string; usuarioId: string },
  ) {
    const room = `sesion_${payload.sesionId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} (usuario ${payload.usuarioId}) se unió a ${room}`);

    // VOTO CIEGO: Retorna al que se conecta el avance anónimo
    try {
      const progreso = await this.votacionesService.obtenerProgresoAnonimo(payload.sesionId);
      client.emit('progresoActualizado', progreso);
    } catch (e: any) {
      client.emit('errorVotacion', { message: e.message });
    }
  }

  /**
   * Emite un voto por WebSocket.
   */
  @SubscribeMessage('emitirVoto')
  async handleEmitirVoto(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { sesionId: string; usuarioId: string; voto: EmitirVotoDto },
  ) {
    try {
      const res = await this.votacionesService.registrarVoto(
        payload.sesionId,
        payload.usuarioId,
        payload.voto,
      );

      const room = `sesion_${payload.sesionId}`;

      if (res.sesionCerrada) {
        // Al completarse o cerrarse anticipadamente, se revela el dictamen consolidado a toda la sala
        this.server.to(room).emit('sesionFinalizada', {
          sesionId: payload.sesionId,
          dictamen: res.dictamen,
          documentoConsolidado: res.documentoConsolidado,
        });
      } else {
        // VOTO CIEGO EN TRÁNSITO: Difunde únicamente el conteo numérico a la sala
        this.server.to(room).emit('progresoActualizado', {
          sesionId: payload.sesionId,
          totalRecibidos: res.totalVotosActuales,
          totalEsperados: res.totalEsperados,
        });
      }

      // Confirmación privada para el evaluador emisor
      client.emit('votoRegistradoExito', {
        sesionId: payload.sesionId,
        sesionCerrada: res.sesionCerrada,
      });
    } catch (e: any) {
      client.emit('errorVotacion', { message: e.message });
    }
  }

  /**
   * Emite el dictamen formal del Presidente del CEI por WebSocket.
   */
  @SubscribeMessage('emitirDictamenPresidente')
  async handleDictamenPresidente(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      sesionId: string;
      presidenteId: string;
      dictamen: EmitirDictamenPresidenteDto;
    },
  ) {
    try {
      const res = await this.votacionesService.registrarDictamenPresidente(
        payload.sesionId,
        payload.presidenteId,
        payload.dictamen,
      );

      const room = `sesion_${payload.sesionId}`;
      this.server.to(room).emit('dictamenPresidenteActualizado', {
        sesionId: payload.sesionId,
        dictamenPresidente: res,
      });

      client.emit('dictamenPresidenteRegistradoExito', res);
    } catch (e: any) {
      client.emit('errorVotacion', { message: e.message });
    }
  }
}
