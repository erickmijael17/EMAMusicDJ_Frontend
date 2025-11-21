import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServicioApi } from '../../../core/base/api.service';
import { REPRODUCTOR_END_POINTS } from '../providers/reproductor-end-points';
import { EstadoReproductorDto, RespuestaToggleFavorito } from '../models/reproductor-backend.model';

@Injectable({
    providedIn: 'root'
})
export class ServicioReproductorBackend extends ServicioApi {
    private readonly _endpoints = REPRODUCTOR_END_POINTS;

    obtenerEstado(usuarioId: number): Observable<EstadoReproductorDto> {
        return this.obtener<EstadoReproductorDto>(
            this._endpoints.estado(usuarioId)
        );
    }

    reproducir(videoId: string, usuarioId: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.reproducir,
            { usuarioId, videoId }
        );
    }

    reproducirDesdeBusqueda(
        usuarioId: number,
        videoId: string,
        terminoBusqueda: string,
        indiceEnBusqueda: number
    ): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.reproducirDesdeBusqueda,
            { usuarioId, videoId, terminoBusqueda, indiceEnBusqueda }
        );
    }

    play(usuarioId: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.play,
            { usuarioId }
        );
    }

    pause(usuarioId: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.pause,
            { usuarioId }
        );
    }

    siguiente(usuarioId: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.siguiente,
            { usuarioId }
        );
    }

    anterior(usuarioId: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.anterior,
            { usuarioId }
        );
    }

    cambiarVolumen(usuarioId: number, volumen: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.volumen,
            { usuarioId, volumen }
        );
    }

    saltarPosicion(usuarioId: number, posicionSegundos: number): Observable<EstadoReproductorDto> {
        return this.enviar<EstadoReproductorDto>(
            this._endpoints.posicion,
            { usuarioId, posicionSegundos }
        );
    }

    toggleFavorito(usuarioId: number): Observable<RespuestaToggleFavorito> {
        return this.enviar<RespuestaToggleFavorito>(
            this._endpoints.favoritoToggle,
            { usuarioId }
        );
    }
}
