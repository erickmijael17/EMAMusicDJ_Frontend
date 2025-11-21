import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { BaseCrudService } from '../../../core/base/base-crud.service';
import { MUSIC_END_POINTS } from '../providers/music-end-points';
import {
  AlbumDto,
  CrearAlbumDto,
  ActualizarAlbumDto,
  EstadisticasAlbumesDto,
  EstadisticasAlbumesArtistaDto
} from '../models/album.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioAlbumes extends BaseCrudService<AlbumDto, CrearAlbumDto, ActualizarAlbumDto> {
  private readonly _endPoints = MUSIC_END_POINTS;
  protected override readonly endPoint = this._endPoints.albumes.listar;

  buscarAlbumes(titulo: string): Observable<AlbumDto[]> {
    const parametros = new HttpParams().set('titulo', titulo);
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.buscar, parametros);
  }

  obtenerAlbumesPorArtista(artistaId: number): Observable<AlbumDto[]> {
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.porArtista(artistaId));
  }

  obtenerAlbumesPorGenero(genero: string): Observable<AlbumDto[]> {
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.porGenero(genero));
  }

  obtenerAlbumesPorAnio(anio: number): Observable<AlbumDto[]> {
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.porAnio(anio));
  }

  obtenerAlbumesPorRangoAnios(anioInicio: number, anioFin: number): Observable<AlbumDto[]> {
    const parametros = new HttpParams()
      .set('anioInicio', anioInicio.toString())
      .set('anioFin', anioFin.toString());
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.rangoAnios, parametros);
  }

  buscarAlbumesPorArtista(nombreArtista: string): Observable<AlbumDto[]> {
    const parametros = new HttpParams().set('nombreArtista', nombreArtista);
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.buscarPorArtista, parametros);
  }

  obtenerAlbumesPorTipo(tipo: string): Observable<AlbumDto[]> {
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.porTipo(tipo));
  }

  obtenerAlbumesRecientes(): Observable<AlbumDto[]> {
    return this.obtener<AlbumDto[]>(this._endPoints.albumes.recientes);
  }

  obtenerEstadisticasPorArtista(artistaId: number): Observable<EstadisticasAlbumesArtistaDto> {
    return this.obtener<EstadisticasAlbumesArtistaDto>(
      this._endPoints.albumes.estadisticasArtista(artistaId)
    );
  }

  obtenerEstadisticasGenerales(): Observable<EstadisticasAlbumesDto> {
    return this.obtener<EstadisticasAlbumesDto>(this._endPoints.albumes.estadisticasGeneral);
  }
}


