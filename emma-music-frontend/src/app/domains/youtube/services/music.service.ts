import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, tap, catchError } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { YOUTUBE_END_POINTS } from '../providers/youtube-end-points';
import {
  CancionHibridaDto,
  ResultadoReproduccionHibridaDto,
  ResultadoBusquedaHibridaDto
} from '../models/youtube-search.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioMusica extends ServicioApi {
  private readonly _endpoints = YOUTUBE_END_POINTS;

  private _resultadosBusqueda = new BehaviorSubject<CancionHibridaDto[]>([]);
  public resultadosBusqueda$ = this._resultadosBusqueda.asObservable();

  private _estaBuscando = new BehaviorSubject<boolean>(false);
  public estaBuscando$ = this._estaBuscando.asObservable();

  private _errorBusqueda = new BehaviorSubject<string | null>(null);
  public errorBusqueda$ = this._errorBusqueda.asObservable();

  buscarHibrido(consulta: string): Observable<CancionHibridaDto[]> {
    if (!consulta || consulta.trim().length === 0) {
      this._resultadosBusqueda.next([]);
      return throwError(() => new Error('El término de búsqueda no puede estar vacío'));
    }

    this._estaBuscando.next(true);
    this._errorBusqueda.next(null);

    const parametros = new HttpParams().set('q', consulta.trim());

    return this.obtener<CancionHibridaDto[]>(this._endpoints.hibrido.buscar, parametros).pipe(
      tap(resultados => {
        this._resultadosBusqueda.next(resultados);
        this._estaBuscando.next(false);
      }),
      catchError(error => {
        this._estaBuscando.next(false);
        this._errorBusqueda.next(error.message);
        return throwError(() => error);
      })
    );
  }

  obtenerUrlReproduccion(idVideo: string, usuarioId?: number): Observable<ResultadoReproduccionHibridaDto> {
    if (!idVideo || idVideo.trim().length === 0) {
      return throwError(() => new Error('El idVideo no puede estar vacío'));
    }

    if (!usuarioId) {
      console.warn('Se recomienda proporcionar usuarioId para procesar migración automática');
      return this.obtenerStreamYouTube(idVideo);
    }

    const parametros = new HttpParams().set('usuarioId', usuarioId.toString());

    return this.obtener<ResultadoReproduccionHibridaDto>(
      this._endpoints.hibrido.reproducir(idVideo),
      parametros
    ).pipe(
      tap(resultado => {
        console.log(`✅ Reproducción procesada para ${idVideo}`);
        console.log(`Tipo: ${resultado.tipo_reproduccion || 'STREAM'}`);
        console.log(`🔄 Migración automática activada si contador >= 1`);
      }),
      catchError(error => {
        console.error('Error obteniendo stream híbrido, intentando YouTube directo:', error);
        return this.obtenerStreamYouTube(idVideo);
      })
    );
  }

  agregarCancionAPlaylist(listaId: number, idVideo: string, usuarioId?: number): Observable<CancionHibridaDto> {
    if (!idVideo || idVideo.trim().length === 0) {
      return throwError(() => new Error('El idVideo no puede estar vacío'));
    }

    let parametros = new HttpParams().set('videoId', idVideo);
    if (usuarioId) {
      parametros = parametros.set('usuarioId', usuarioId.toString());
    }

    return this.enviar<CancionHibridaDto>(
      this._endpoints.hibrido.agregarAPlaylist(listaId),
      undefined,
      parametros
    );
  }

  buscarPistasEnYouTube(termino: string): Observable<CancionHibridaDto[]> {
    if (!termino || termino.trim().length === 0) {
      this._resultadosBusqueda.next([]);
      return throwError(() => new Error('El término de búsqueda no puede estar vacío'));
    }

    this._estaBuscando.next(true);
    this._errorBusqueda.next(null);

    const parametros = new HttpParams().set('q', termino.trim());
    return this.obtener<any>(this._endpoints.hibrido.buscar, parametros).pipe(
      tap(respuesta => {
        console.log('🔍 [DEBUG] Respuesta del backend (RAW):', respuesta);
        console.log('🔍 [DEBUG] Tipo de respuesta:', Array.isArray(respuesta) ? 'Array' : 'Object');

        // Determinar si es un array directo o un objeto wrapper
        let resultados: CancionHibridaDto[];

        if (Array.isArray(respuesta)) {
          // Es un array directo (formato de /api/youtube/buscar)
          console.log('✅ [DEBUG] Formato: Array directo');
          resultados = respuesta;
        } else if (respuesta && respuesta.canciones && Array.isArray(respuesta.canciones)) {
          // Es un objeto wrapper con propiedad 'canciones' (formato híbrido)
          console.log('✅ [DEBUG] Formato: Objeto wrapper con canciones');
          console.log('📊 [DEBUG] Total resultados:', respuesta.totalResultados);
          console.log('💬 [DEBUG] Mensaje:', respuesta.mensaje);
          resultados = respuesta.canciones;
        } else {
          // Formato desconocido
          console.error('❌ [DEBUG] Formato de respuesta desconocido:', respuesta);
          resultados = [];
        }

        console.log('🔍 [DEBUG] Total canciones extraídas:', resultados.length);
        if (resultados.length > 0) {
          console.log('🔍 [DEBUG] Primera canción:', resultados[0]);
          console.log('🔍 [DEBUG] id_video de primera canción:', resultados[0].id_video);
        }

        this._resultadosBusqueda.next(resultados);
        this._estaBuscando.next(false);
      }),
      catchError(error => {
        console.error('❌ [DEBUG] Error en búsqueda:', error);
        this._estaBuscando.next(false);
        this._errorBusqueda.next(error.message || 'Ocurrió un error en la búsqueda híbrida.');
        return throwError(() => error);
      })
    );
  }

  obtenerStreamYouTube(idVideo: string): Observable<ResultadoReproduccionHibridaDto> {
    if (!idVideo || idVideo.trim().length === 0) {
      return throwError(() => new Error('El idVideo no puede estar vacío'));
    }

    return this.obtener<ResultadoReproduccionHibridaDto>(this._endpoints.stream(idVideo));
  }

  limpiarResultadosBusqueda(): void {
    this._resultadosBusqueda.next([]);
    this._errorBusqueda.next(null);
  }

}
