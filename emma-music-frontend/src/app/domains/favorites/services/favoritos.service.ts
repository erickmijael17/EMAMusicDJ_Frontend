import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ServicioApi } from '../../../core/base/api.service';
import { FAVORITES_END_POINTS } from '../providers/favorites-end-points';
import {
  RespuestaFavoritoHibrido,
  RespuestaListaFavoritosHibrida,
  RespuestaEliminacionFavorito,
  ConteoFavoritosDto,
  AgregarFavoritoRequest,
  VerificacionFavoritoDto
} from '../models/favorito.model';

export interface ErrorFavorito {
  status: number;
  mensaje: string;
  titulo: string;
  accion: string;
  icono: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioFavoritos extends ServicioApi {
  private readonly _endpoints = FAVORITES_END_POINTS;

  agregarFavorito(usuarioId: number, idVideoYoutube: string): Observable<RespuestaFavoritoHibrido> {
    const body: AgregarFavoritoRequest = { usuarioId, idVideoYoutube };
    console.log('[ServicioFavoritos] Agregando favorito:', body);
    console.log('[ServicioFavoritos] Endpoint:', this._endpoints.agregar());

    return this.enviar<RespuestaFavoritoHibrido>(
      this._endpoints.agregar(),
      body
    ).pipe(
      tap(respuesta => {
        console.log('[ServicioFavoritos] Favorito agregado exitosamente:', respuesta);
      }),
      catchError(error => this.manejarErrorFavorito(error))
    );
  }

  eliminarFavorito(usuarioId: number, idVideoYoutube: string): Observable<RespuestaEliminacionFavorito> {
    console.log('[ServicioFavoritos] Eliminando favorito:', { usuarioId, idVideoYoutube });

    return this.eliminar<RespuestaEliminacionFavorito>(
      this._endpoints.eliminar(usuarioId, idVideoYoutube)
    ).pipe(
      tap(respuesta => {
        console.log('[ServicioFavoritos] Favorito eliminado exitosamente:', respuesta);
      }),
      catchError(error => this.manejarErrorFavorito(error))
    );
  }

  obtenerFavoritosPorUsuario(usuarioId: number): Observable<RespuestaListaFavoritosHibrida> {
    return this.obtener<RespuestaListaFavoritosHibrida>(
      this._endpoints.porUsuario(usuarioId)
    ).pipe(
      catchError(error => this.manejarErrorFavorito(error))
    );
  }

  contarFavoritos(usuarioId: number): Observable<ConteoFavoritosDto> {
    return this.obtener<ConteoFavoritosDto>(
      this._endpoints.contar(usuarioId)
    ).pipe(
      catchError(error => this.manejarErrorFavorito(error))
    );
  }

  verificarFavorito(usuarioId: number, idVideoYoutube: string): Observable<VerificacionFavoritoDto> {
    return this.obtener<VerificacionFavoritoDto>(
      this._endpoints.verificar(usuarioId, idVideoYoutube)
    ).pipe(
      catchError(error => {
        console.warn('[ServicioFavoritos] Error verificando favorito, asumiendo false');
        return throwError(() => this.manejarErrorFavorito(error));
      })
    );
  }

  alternarFavorito(usuarioId: number, idVideoYoutube: string, estadoActual: boolean): Observable<any> {
    console.log('[ServicioFavoritos] Alternando favorito:', { usuarioId, idVideoYoutube, estadoActual });

    if (estadoActual) {
      return this.eliminarFavorito(usuarioId, idVideoYoutube);
    } else {
      return this.agregarFavorito(usuarioId, idVideoYoutube);
    }
  }

  private manejarErrorFavorito(error: any): Observable<never> {
    console.error('[ServicioFavoritos] Error HTTP completo:', error);

    const errorInfo = this.obtenerInfoError(error.status || 0);

    const errorFavorito: ErrorFavorito = {
      status: error.status || 0,
      mensaje: errorInfo.mensaje,
      titulo: errorInfo.titulo,
      accion: errorInfo.accion,
      icono: errorInfo.icono
    };

    console.error('[ServicioFavoritos] Error procesado:', errorFavorito);

    return throwError(() => errorFavorito);
  }

  private obtenerInfoError(status: number): Omit<ErrorFavorito, 'status'> {
    const errores: { [key: number]: Omit<ErrorFavorito, 'status'> } = {
      0: {
        titulo: 'Sin conexión',
        mensaje: 'No se pudo conectar al servidor. Verifica tu conexión.',
        accion: 'Verifica tu conexión a internet',
        icono: '📡'
      },
      404: {
        titulo: 'Canción no encontrada',
        mensaje: 'La canción no existe en el sistema.',
        accion: 'Reproduce la canción primero',
        icono: '🔍'
      },
      409: {
        titulo: 'Ya está en favoritos',
        mensaje: 'Esta canción ya está en tus favoritos.',
        accion: 'Puedes eliminarla si quieres',
        icono: '✓'
      },
      500: {
        titulo: 'Error del servidor',
        mensaje: 'La canción debe reproducirse antes de agregarla a favoritos.',
        accion: 'Reproduce la canción una vez',
        icono: '⚠️'
      }
    };

    return errores[status] || {
      titulo: 'Error',
      mensaje: 'Ocurrió un error inesperado.',
      accion: 'Intenta nuevamente',
      icono: '❌'
    };
  }
}
