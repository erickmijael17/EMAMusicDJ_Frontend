import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { YOUTUBE_END_POINTS } from '../providers/youtube-end-points';
import {
  MetadatoYouTubeDto,
  EstadisticasMetadatosDto
} from '../models/youtube-metadata.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioMetadatosYouTube extends ServicioApi {
  private readonly _endPoints = YOUTUBE_END_POINTS;

  obtenerMetadato(videoId: string): Observable<MetadatoYouTubeDto> {
    return this.obtener<MetadatoYouTubeDto>(this._endPoints.metadatos.obtener(videoId));
  }

  buscarMetadatos(termino: string): Observable<MetadatoYouTubeDto[]> {
    const parametros = new HttpParams().set('q', termino);
    return this.obtener<MetadatoYouTubeDto[]>(this._endPoints.metadatos.buscar, parametros);
  }

  obtenerCandidatasMigracion(umbral?: number): Observable<MetadatoYouTubeDto[]> {
    let parametros: HttpParams | undefined;
    if (umbral !== undefined) {
      parametros = new HttpParams().set('umbral', umbral.toString());
    }
    return this.obtener<MetadatoYouTubeDto[]>(
      this._endPoints.metadatos.candidatasMigracion,
      parametros
    );
  }

  obtenerMetadatosUsadasEnPlaylists(): Observable<MetadatoYouTubeDto[]> {
    return this.obtener<MetadatoYouTubeDto[]>(this._endPoints.metadatos.usadasPlaylists);
  }

  incrementarReproducciones(videoId: string): Observable<void> {
    return this.enviar<void>(this._endPoints.metadatos.incrementarReproducciones(videoId));
  }

  incrementarPlaylists(videoId: string): Observable<void> {
    return this.enviar<void>(this._endPoints.metadatos.incrementarPlaylists(videoId));
  }

  limpiarAntiguos(dias: number): Observable<void> {
    const parametros = new HttpParams().set('dias', dias.toString());
    return this.enviar<void>(this._endPoints.metadatos.limpiarAntiguos, undefined, parametros);
  }

  obtenerEstadisticas(): Observable<EstadisticasMetadatosDto> {
    return this.obtener<EstadisticasMetadatosDto>(this._endPoints.metadatos.estadisticas);
  }
}
