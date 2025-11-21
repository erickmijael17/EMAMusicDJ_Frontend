import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { REPRODUCTOR_END_POINTS } from '../providers/reproductor-end-points';
import {
    ColaReproduccionDto,
    AgregarAColaRequest,
    ReordenarColaRequest,
    CambiarModoRequest,
    RespuestaColaOperacion,
    RespuestaLimpiarCola
} from '../models/reproductor-backend.model';

@Injectable({
    providedIn: 'root'
})
export class ServicioColaBackend extends ServicioApi {
    private readonly _endpoints = REPRODUCTOR_END_POINTS.cola;

    obtenerCola(usuarioId: number): Observable<ColaReproduccionDto> {
        return this.obtener<ColaReproduccionDto>(
            this._endpoints.obtener(usuarioId)
        );
    }

    agregarACola(request: AgregarAColaRequest): Observable<RespuestaColaOperacion> {
        return this.enviar<RespuestaColaOperacion>(
            this._endpoints.agregar,
            request
        );
    }

    eliminarCancion(usuarioId: number, indice: number): Observable<RespuestaColaOperacion> {
        return this.eliminar<RespuestaColaOperacion>(
            this._endpoints.eliminar,
            { usuarioId, indice }
        );
    }

    limpiarCola(usuarioId: number): Observable<RespuestaLimpiarCola> {
        return this.eliminar<RespuestaLimpiarCola>(
            this._endpoints.limpiar,
            { usuarioId }
        );
    }

    reordenarCola(request: ReordenarColaRequest): Observable<RespuestaColaOperacion> {
        return this.enviar<RespuestaColaOperacion>(
            this._endpoints.reordenar,
            request
        );
    }

    cambiarModo(request: CambiarModoRequest): Observable<RespuestaColaOperacion> {
        return this.enviar<RespuestaColaOperacion>(
            this._endpoints.cambiarModo,
            request
        );
    }
}
