import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { BaseCrudService } from '../../../core/base/base-crud.service';
import { MUSIC_END_POINTS } from '../providers/music-end-points';
import {
  ArtistaDto,
  CrearArtistaDto,
  ActualizarArtistaDto,
  EstadisticasArtistasDto
} from '../models/artista.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioArtistas extends BaseCrudService<ArtistaDto, CrearArtistaDto, ActualizarArtistaDto> {
  protected readonly _endPoints = MUSIC_END_POINTS;
  protected override readonly endPoint = this._endPoints.artistas.listar;

  // Métodos específicos que no cubre el CRUD base

  buscarArtistas(nombre: string): Observable<ArtistaDto[]> {
    const parametros = new HttpParams().set('nombre', nombre);
    return this.obtener<ArtistaDto[]>(this._endPoints.artistas.buscar, parametros);
  }

  obtenerArtistasVerificados(): Observable<ArtistaDto[]> {
    return this.obtener<ArtistaDto[]>(this._endPoints.artistas.verificados);
  }

  obtenerArtistasPorGenero(genero: string): Observable<ArtistaDto[]> {
    return this.obtener<ArtistaDto[]>(this._endPoints.artistas.porGenero(genero));
  }

  obtenerEstadisticas(): Observable<EstadisticasArtistasDto> {
    return this.obtener<EstadisticasArtistasDto>(this._endPoints.artistas.estadisticas);
  }
}


