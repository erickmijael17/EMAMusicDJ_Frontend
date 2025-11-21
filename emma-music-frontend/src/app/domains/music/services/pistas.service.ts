import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { BaseCrudService } from '../../../core/base/base-crud.service';
import { MUSIC_END_POINTS } from '../providers/music-end-points';
import {
  PistaDto,
  CrearPistaDto,
  ActualizarPistaDto,
  EstadisticasArchivosDto
} from '../models/pista.model';

@Injectable({
  providedIn: 'root'
})
export class ServicioPistas extends BaseCrudService<PistaDto, CrearPistaDto, ActualizarPistaDto> {
  private readonly _endpoints = MUSIC_END_POINTS;
  protected override readonly endPoint = this._endpoints.pistas.listar;

  buscarPistas(titulo: string): Observable<PistaDto[]> {
    const parametros = new HttpParams().set('titulo', titulo);
    return this.obtener<PistaDto[]>(this._endpoints.pistas.buscar, parametros);
  }

  obtenerPistasDescargadas(): Observable<PistaDto[]> {
    return this.obtener<PistaDto[]>(this._endpoints.pistas.descargadas);
  }

  obtenerEstadisticasArchivos(): Observable<EstadisticasArchivosDto> {
    return this.obtener<EstadisticasArchivosDto>(this._endpoints.pistas.estadisticasArchivos);
  }
}
