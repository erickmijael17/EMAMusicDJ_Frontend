import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ServicioApi } from '../../../core/base/api.service';
import { ServicioAutenticacion } from '../../auth/services/auth.service';
import { BIBLIOTECA_END_POINTS } from '../providers/biblioteca-end-points';
import {
    BibliotecaDto,
    BibliotecaPaginadaDto,
    CancionBibliotecaDto,
    EstadisticasBibliotecaDto
} from '../models/biblioteca.model';

export interface EstadoServicioBiblioteca {
    bibliotecaCompleta: BibliotecaDto | null;
    cancionesPaginadas: BibliotecaPaginadaDto | null;
    favoritosPaginados: BibliotecaPaginadaDto | null;
    recientesPaginadas: BibliotecaPaginadaDto | null;
    estadisticas: EstadisticasBibliotecaDto | null;
    estaCargando: boolean;
    error: string | null;
}

interface CacheItem<T> {
    datos: T;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class ServicioBiblioteca extends ServicioApi {

    private servicioAuth = inject(ServicioAutenticacion);
    private readonly endpoints = BIBLIOTECA_END_POINTS;
    private readonly CACHE_DURATION_MS = 5 * 60 * 1000;

    private cacheEstadisticas: Map<number, CacheItem<EstadisticasBibliotecaDto>> = new Map();
    private cacheBibliotecaCompleta: Map<number, CacheItem<BibliotecaDto>> = new Map();

    private _bibliotecaCompleta = new BehaviorSubject<BibliotecaDto | null>(null);
    public bibliotecaCompleta$ = this._bibliotecaCompleta.asObservable();

    private _cancionesPaginadas = new BehaviorSubject<BibliotecaPaginadaDto | null>(null);
    public cancionesPaginadas$ = this._cancionesPaginadas.asObservable();

    private _favoritosPaginados = new BehaviorSubject<BibliotecaPaginadaDto | null>(null);
    public favoritosPaginados$ = this._favoritosPaginados.asObservable();

    private _recientesPaginadas = new BehaviorSubject<BibliotecaPaginadaDto | null>(null);
    public recientesPaginadas$ = this._recientesPaginadas.asObservable();

    private _estadisticas = new BehaviorSubject<EstadisticasBibliotecaDto | null>(null);
    public estadisticas$ = this._estadisticas.asObservable();

    private _estaCargando = new BehaviorSubject<boolean>(false);
    public estaCargando$ = this._estaCargando.asObservable();

    private _error = new BehaviorSubject<string | null>(null);
    public error$ = this._error.asObservable();

    public readonly estado = signal<EstadoServicioBiblioteca>({
        bibliotecaCompleta: null,
        cancionesPaginadas: null,
        favoritosPaginados: null,
        recientesPaginadas: null,
        estadisticas: null,
        estaCargando: false,
        error: null
    });

    private obtenerUsuarioId(): number {
        const usuario = this.servicioAuth.obtenerUsuarioActual();
        if (!usuario?.usuarioId) {
            throw new Error('Usuario no autenticado');
        }
        return usuario.usuarioId;
    }

    obtenerBibliotecaCompleta(usuarioId: number): Observable<BibliotecaDto> {
        this._estaCargando.next(true);
        this._error.next(null);

        const cached = this.cacheBibliotecaCompleta.get(usuarioId);
        const ahora = Date.now();

        if (cached && (ahora - cached.timestamp) < this.CACHE_DURATION_MS) {
            this._bibliotecaCompleta.next(cached.datos);
            this._estaCargando.next(false);
            this.actualizarEstado({
                bibliotecaCompleta: cached.datos,
                estaCargando: false
            });
            console.log('[Biblioteca] Datos obtenidos desde cache');
            return of(cached.datos);
        }

        const url = `${this.urlApi}${this.endpoints.obtenerCompleta(usuarioId)}`;

        return this.http.get<BibliotecaDto>(url).pipe(
            tap((biblioteca) => {
                this.cacheBibliotecaCompleta.set(usuarioId, {
                    datos: biblioteca,
                    timestamp: ahora
                });
                this._bibliotecaCompleta.next(biblioteca);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    bibliotecaCompleta: biblioteca,
                    estaCargando: false
                });
                console.log(`[Biblioteca] Biblioteca completa cargada: ${biblioteca.totalCanciones} canciones`);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    estaCargando: false,
                    error: mensajeError
                });
                return throwError(() => error);
            })
        );
    }

    obtenerCancionesPaginadas(
        usuarioId: number,
        pagina: number = 0,
        tamanio: number = 20
    ): Observable<BibliotecaPaginadaDto> {
        this._estaCargando.next(true);
        this._error.next(null);

        const params = new HttpParams()
            .set('pagina', pagina.toString())
            .set('tamanio', tamanio.toString());

        const url = `${this.urlApi}${this.endpoints.obtenerCanciones(usuarioId)}`;

        return this.http.get<BibliotecaPaginadaDto>(url, { params }).pipe(
            tap((paginado) => {
                this._cancionesPaginadas.next(paginado);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    cancionesPaginadas: paginado,
                    estaCargando: false
                });
                console.log(`[Biblioteca] Canciones cargadas: ${paginado.canciones.length} de ${paginado.totalElementos}`);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    estaCargando: false,
                    error: mensajeError
                });
                return throwError(() => error);
            })
        );
    }

    obtenerFavoritosPaginados(
        usuarioId: number,
        pagina: number = 0,
        tamanio: number = 20
    ): Observable<BibliotecaPaginadaDto> {
        this._estaCargando.next(true);
        this._error.next(null);

        const params = new HttpParams()
            .set('pagina', pagina.toString())
            .set('tamanio', tamanio.toString());

        const url = `${this.urlApi}${this.endpoints.obtenerFavoritos(usuarioId)}`;

        return this.http.get<BibliotecaPaginadaDto>(url, { params }).pipe(
            tap((paginado) => {
                this._favoritosPaginados.next(paginado);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    favoritosPaginados: paginado,
                    estaCargando: false
                });
                console.log(`[Biblioteca] Favoritos cargados: ${paginado.canciones.length} de ${paginado.totalElementos}`);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    estaCargando: false,
                    error: mensajeError
                });
                return throwError(() => error);
            })
        );
    }

    obtenerRecientesPaginadas(
        usuarioId: number,
        pagina: number = 0,
        tamanio: number = 20
    ): Observable<BibliotecaPaginadaDto> {
        this._estaCargando.next(true);
        this._error.next(null);

        const params = new HttpParams()
            .set('pagina', pagina.toString())
            .set('tamanio', tamanio.toString());

        const url = `${this.urlApi}${this.endpoints.obtenerRecientes(usuarioId)}`;

        return this.http.get<BibliotecaPaginadaDto>(url, { params }).pipe(
            tap((paginado) => {
                this._recientesPaginadas.next(paginado);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    recientesPaginadas: paginado,
                    estaCargando: false
                });
                console.log(`[Biblioteca] Recientes cargadas: ${paginado.canciones.length} de ${paginado.totalElementos}`);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    estaCargando: false,
                    error: mensajeError
                });
                return throwError(() => error);
            })
        );
    }

    obtenerEstadisticas(usuarioId: number): Observable<EstadisticasBibliotecaDto> {
        this._error.next(null);

        const cached = this.cacheEstadisticas.get(usuarioId);
        const ahora = Date.now();

        if (cached && (ahora - cached.timestamp) < this.CACHE_DURATION_MS) {
            this._estadisticas.next(cached.datos);
            this.actualizarEstado({ estadisticas: cached.datos });
            console.log('[Biblioteca] Estadísticas obtenidas desde cache');
            return of(cached.datos);
        }

        const url = `${this.urlApi}${this.endpoints.obtenerEstadisticas(usuarioId)}`;

        return this.http.get<EstadisticasBibliotecaDto>(url).pipe(
            tap((estadisticas) => {
                this.cacheEstadisticas.set(usuarioId, {
                    datos: estadisticas,
                    timestamp: ahora
                });
                this._estadisticas.next(estadisticas);
                this.actualizarEstado({ estadisticas });
                console.log(`[Biblioteca] Estadísticas cargadas: ${estadisticas.totalReproducciones} reproducciones`);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this.actualizarEstado({ error: mensajeError });
                return throwError(() => error);
            })
        );
    }

    invalidarCache(usuarioId?: number): void {
        if (usuarioId) {
            this.cacheEstadisticas.delete(usuarioId);
            this.cacheBibliotecaCompleta.delete(usuarioId);
            console.log(`[Biblioteca] Cache invalidado para usuario ${usuarioId}`);
        } else {
            this.cacheEstadisticas.clear();
            this.cacheBibliotecaCompleta.clear();
            console.log('[Biblioteca] Todo el cache invalidado');
        }
    }

    limpiarEstado(): void {
        this._bibliotecaCompleta.next(null);
        this._cancionesPaginadas.next(null);
        this._favoritosPaginados.next(null);
        this._recientesPaginadas.next(null);
        this._estadisticas.next(null);
        this._error.next(null);
        this._estaCargando.next(false);
        this.estado.set({
            bibliotecaCompleta: null,
            cancionesPaginadas: null,
            favoritosPaginados: null,
            recientesPaginadas: null,
            estadisticas: null,
            estaCargando: false,
            error: null
        });
    }

    private actualizarEstado(estadoParcial: Partial<EstadoServicioBiblioteca>): void {
        this.estado.update((estadoActual) => ({
            ...estadoActual,
            ...estadoParcial
        }));
    }

    private obtenerMensajeError(error: HttpErrorResponse): string {
        if (error.error instanceof ErrorEvent) {
            return `Error: ${error.error.message}`;
        }

        const errorApi = error.error as any;

        switch (error.status) {
            case 400:
                return errorApi?.message || 'Solicitud inválida';
            case 401:
                return 'No autorizado. Por favor, inicia sesión';
            case 404:
                return errorApi?.message || 'Biblioteca no encontrada';
            case 500:
                return 'Error del servidor. Intenta de nuevo más tarde';
            default:
                return `Error ${error.status}: ${errorApi?.message || 'Error desconocido'}`;
        }
    }
}
