import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { BaseCrudService } from '../../../core/base/base-crud.service';
import { PLAYBACK_END_POINTS } from '../providers/playback-end-points';
import {
  ReproduccionDto,
  CrearReproduccionDto,
  EstadisticasReproduccionesUsuarioDto,
  PistaPopularDto
} from '../models/reproduccion.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioReproducciones extends BaseCrudService<ReproduccionDto, CrearReproduccionDto, any> {
  private readonly _endPoints = PLAYBACK_END_POINTS;
  protected override readonly endPoint = this._endPoints.reproducciones.crear; // Usamos el endpoint de crear como base, aunque el GET ALL no se use directamente así

  // Alias para mantener compatibilidad o usar el nombre estándar add$
  crearReproduccion(reproduccion: CrearReproduccionDto): Observable<ReproduccionDto> {
    return this.add$(reproduccion);
  }

  obtenerReproduccionesPorUsuario(usuarioId: number): Observable<ReproduccionDto[]> {
    return this.obtener<ReproduccionDto[]>(this._endPoints.reproducciones.porUsuario(usuarioId));
  }

  obtenerReproduccionesPorPista(pistaId: number): Observable<ReproduccionDto[]> {
    return this.obtener<ReproduccionDto[]>(this._endPoints.reproducciones.porPista(pistaId));
  }

  obtenerReproduccionesPorVideo(videoId: string): Observable<ReproduccionDto[]> {
    return this.obtener<ReproduccionDto[]>(this._endPoints.reproducciones.porVideo(videoId));
  }

  obtenerReproduccionesPorUsuarioYFecha(
    usuarioId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<ReproduccionDto[]> {
    const parametros = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.obtener<ReproduccionDto[]>(
      this._endPoints.reproducciones.porUsuarioFecha(usuarioId),
      parametros
    );
  }

  obtenerReproduccionesRecientes(usuarioId: number): Observable<ReproduccionDto[]> {
    return this.obtener<ReproduccionDto[]>(this._endPoints.reproducciones.recientes(usuarioId));
  }

  contarReproduccionesPorUsuario(usuarioId: number): Observable<number> {
    return this.obtener<number>(this._endPoints.reproducciones.contarPorUsuario(usuarioId));
  }

  contarReproduccionesPorPista(pistaId: number): Observable<number> {
    return this.obtener<number>(this._endPoints.reproducciones.contarPorPista(pistaId));
  }

  contarReproduccionesPorVideo(videoId: string): Observable<number> {
    return this.obtener<number>(this._endPoints.reproducciones.contarPorVideo(videoId));
  }

  obtenerEstadisticasUsuario(usuarioId: number): Observable<EstadisticasReproduccionesUsuarioDto> {
    return this.obtener<EstadisticasReproduccionesUsuarioDto>(
      this._endPoints.reproducciones.estadisticasUsuario(usuarioId)
    );
  }

  obtenerReproduccionesPorUsuarioYPista(usuarioId: number, pistaId: number): Observable<ReproduccionDto[]> {
    return this.obtener<ReproduccionDto[]>(
      this._endPoints.reproducciones.porUsuarioPista(usuarioId, pistaId)
    );
  }

  obtenerPistasPopulares(): Observable<PistaPopularDto[]> {
    return this.obtener<PistaPopularDto[]>(this._endPoints.reproducciones.pistasPopulares);
  }
}


