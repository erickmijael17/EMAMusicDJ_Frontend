import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ServicioApi } from '../../../core/base/api.service';
import { ServicioAutenticacion } from '../../auth/services/auth.service';
import { HISTORIAL_END_POINTS } from '../providers/historial-end-points';
import {
    HistorialReproduccionDto,
    HistorialPaginadoDto,
    RegistrarReproduccionRequest,
    RespuestaHistorialOperacion,
    RespuestaHistorialReciente,
    RespuestaContadorHistorial
} from '../models/historial.model';

export interface EstadoServicioHistorial {
    historialPaginado: HistorialPaginadoDto | null;
    historialReciente: HistorialReproduccionDto[];
    estaCargando: boolean;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class ServicioHistorial extends ServicioApi {

    private servicioAuth = inject(ServicioAutenticacion);
    private readonly endpoints = HISTORIAL_END_POINTS;

    private _historialPaginado = new BehaviorSubject<HistorialPaginadoDto | null>(null);
    public historialPaginado$ = this._historialPaginado.asObservable();

    private _historialReciente = new BehaviorSubject<HistorialReproduccionDto[]>([]);
    public historialReciente$ = this._historialReciente.asObservable();

    private _estaCargando = new BehaviorSubject<boolean>(false);
    public estaCargando$ = this._estaCargando.asObservable();

    private _error = new BehaviorSubject<string | null>(null);
    public error$ = this._error.asObservable();

    public readonly estado = signal<EstadoServicioHistorial>({
        historialPaginado: null,
        historialReciente: [],
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

    registrarReproduccion(request: RegistrarReproduccionRequest): Observable<RespuestaHistorialOperacion> {
        this._error.next(null);

        return this.enviar<RespuestaHistorialOperacion>(
            this.endpoints.registrar,
            request
        ).pipe(
            tap((respuesta) => {
                console.log('[Historial] Reproducción registrada:', respuesta.mensaje);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this.actualizarEstado({ error: mensajeError });
                return throwError(() => error);
            })
        );
    }

    obtenerHistorialPaginado(
        usuarioId: number,
        pagina: number = 0,
        tamanio: number = 20
    ): Observable<HistorialPaginadoDto> {
        this._estaCargando.next(true);
        this._error.next(null);

        const params = new HttpParams()
            .set('pagina', pagina.toString())
            .set('tamanio', tamanio.toString());

        const url = `${this.urlApi}${this.endpoints.obtenerPaginado(usuarioId)}`;

        return this.http.get<HistorialPaginadoDto>(url, { params }).pipe(
            tap((historial) => {
                this._historialPaginado.next(historial);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    historialPaginado: historial,
                    estaCargando: false
                });
                console.log(`[Historial] Cargadas ${historial.contenido.length} reproducciones`);
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

    obtenerHistorialReciente(
        usuarioId: number,
        limite: number = 20
    ): Observable<RespuestaHistorialReciente> {
        this._estaCargando.next(true);
        this._error.next(null);

        const params = new HttpParams().set('limite', limite.toString());
        const url = `${this.urlApi}${this.endpoints.obtenerReciente(usuarioId)}`;

        return this.http.get<RespuestaHistorialReciente>(url, { params }).pipe(
            tap((respuesta) => {
                this._historialReciente.next(respuesta.historial);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    historialReciente: respuesta.historial,
                    estaCargando: false
                });
                console.log(`[Historial] Cargadas ${respuesta.total} reproducciones recientes`);
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

    obtenerHistorialPorVideo(
        usuarioId: number,
        videoId: string
    ): Observable<RespuestaHistorialReciente> {
        this._estaCargando.next(true);
        this._error.next(null);

        const url = `${this.urlApi}${this.endpoints.obtenerPorVideo(usuarioId, videoId)}`;

        return this.http.get<RespuestaHistorialReciente>(url).pipe(
            tap((respuesta) => {
                this._estaCargando.next(false);
                this.actualizarEstado({ estaCargando: false });
                console.log(`[Historial] ${respuesta.total} reproducciones del video ${videoId}`);
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

    contarReproducciones(usuarioId: number): Observable<RespuestaContadorHistorial> {
        this._error.next(null);

        const url = `${this.urlApi}${this.endpoints.contador(usuarioId)}`;

        return this.http.get<RespuestaContadorHistorial>(url).pipe(
            tap((respuesta) => {
                console.log(`[Historial] Total de reproducciones: ${respuesta.totalReproducciones}`);
            }),
            catchError((error) => {
                const mensajeError = this.obtenerMensajeError(error);
                this._error.next(mensajeError);
                this.actualizarEstado({ error: mensajeError });
                return throwError(() => error);
            })
        );
    }

    limpiarHistorial(usuarioId: number): Observable<RespuestaHistorialOperacion> {
        this._estaCargando.next(true);
        this._error.next(null);

        return this.eliminar<RespuestaHistorialOperacion>(
            this.endpoints.limpiar(usuarioId)
        ).pipe(
            tap((respuesta) => {
                this._historialPaginado.next(null);
                this._historialReciente.next([]);
                this._estaCargando.next(false);
                this.actualizarEstado({
                    historialPaginado: null,
                    historialReciente: [],
                    estaCargando: false
                });
                console.log('[Historial] Historial limpiado:', respuesta.mensaje);
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

    eliminarReproduccion(reproduccionId: number): Observable<RespuestaHistorialOperacion> {
        this._estaCargando.next(true);
        this._error.next(null);

        return this.eliminar<RespuestaHistorialOperacion>(
            this.endpoints.eliminar(reproduccionId)
        ).pipe(
            tap((respuesta) => {
                const historialActual = this._historialPaginado.value;
                if (historialActual) {
                    const contenidoActualizado = historialActual.contenido.filter(
                        (item) => item.reproduccionId !== reproduccionId
                    );
                    const historialActualizado = {
                        ...historialActual,
                        contenido: contenidoActualizado,
                        totalElementos: historialActual.totalElementos - 1
                    };
                    this._historialPaginado.next(historialActualizado);
                    this.actualizarEstado({ historialPaginado: historialActualizado });
                }

                const recienteActual = this._historialReciente.value;
                const recienteActualizado = recienteActual.filter(
                    (item) => item.reproduccionId !== reproduccionId
                );
                this._historialReciente.next(recienteActualizado);

                this._estaCargando.next(false);
                this.actualizarEstado({
                    historialReciente: recienteActualizado,
                    estaCargando: false
                });
                console.log('[Historial] Reproducción eliminada:', respuesta.mensaje);
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

    limpiarEstado(): void {
        this._historialPaginado.next(null);
        this._historialReciente.next([]);
        this._error.next(null);
        this._estaCargando.next(false);
        this.estado.set({
            historialPaginado: null,
            historialReciente: [],
            estaCargando: false,
            error: null
        });
    }

    private actualizarEstado(estadoParcial: Partial<EstadoServicioHistorial>): void {
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
                return errorApi?.message || 'Video no encontrado';
            case 500:
                return 'Error del servidor. Intenta de nuevo más tarde';
            default:
                return `Error ${error.status}: ${errorApi?.message || 'Error desconocido'}`;
        }
    }
}
