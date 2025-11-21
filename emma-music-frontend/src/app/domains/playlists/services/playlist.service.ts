import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { PLAYLIST_END_POINTS } from '../providers/playlist-end-points';
import { ServicioAutenticacion } from '../../auth/services/auth.service';
import {
  PlaylistDto,
  CrearPlaylistDto,
  ActualizarPlaylistDto,
  CancionPlaylistDto,
  RespuestaOperacionPlaylist,
  ContadorPlaylistDto
} from '../models/playlist.model';

export interface EstadoServicioPlaylist {
  playlists: PlaylistDto[];
  playlistActual: PlaylistDto | null;
  cancionesPlaylist: CancionPlaylistDto[];
  playlistsPublicas: PlaylistDto[];
  estaCargando: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioPlaylist {

  private http = inject(HttpClient);
  private servicioAuth = inject(ServicioAutenticacion);
  private readonly urlApi = environment.apiUrl;
  private readonly endpoints = PLAYLIST_END_POINTS;

  private _playlists = new BehaviorSubject<PlaylistDto[]>([]);
  public playlists$ = this._playlists.asObservable();

  private _playlistActual = new BehaviorSubject<PlaylistDto | null>(null);
  public playlistActual$ = this._playlistActual.asObservable();

  private _cancionesPlaylist = new BehaviorSubject<CancionPlaylistDto[]>([]);
  public cancionesPlaylist$ = this._cancionesPlaylist.asObservable();

  private _playlistsPublicas = new BehaviorSubject<PlaylistDto[]>([]);
  public playlistsPublicas$ = this._playlistsPublicas.asObservable();

  private _estaCargando = new BehaviorSubject<boolean>(false);
  public estaCargando$ = this._estaCargando.asObservable();

  private _error = new BehaviorSubject<string | null>(null);
  public error$ = this._error.asObservable();

  public readonly estado = signal<EstadoServicioPlaylist>({
    playlists: [],
    playlistActual: null,
    cancionesPlaylist: [],
    playlistsPublicas: [],
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


  obtenerMisPlaylists(): Observable<PlaylistDto[]> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();

      return this.http.get<PlaylistDto[]>(`${this.urlApi}${this.endpoints.obtenerPorUsuario(usuarioId)}`)
        .pipe(
          tap(playlists => {
            this._playlists.next(playlists);
            this._estaCargando.next(false);
            this.actualizarEstado({ playlists, estaCargando: false });
          }),
          catchError(error => {
            if (error.status === 404) {
              const playlistsVacias: PlaylistDto[] = [];
              this._playlists.next(playlistsVacias);
              this._estaCargando.next(false);
              this.actualizarEstado({ playlists: playlistsVacias, estaCargando: false });
              return of(playlistsVacias);
            }

            const mensajeError = this.manejarError(error);
            this._error.next(mensajeError);
            this._estaCargando.next(false);
            this.actualizarEstado({ estaCargando: false, error: mensajeError });
            return throwError(() => error);
          })
        );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }


  obtenerPlaylistPorId(id: number): Observable<PlaylistDto> {
    this._estaCargando.next(true);
    this._error.next(null);

    return this.http.get<PlaylistDto>(`${this.urlApi}${this.endpoints.obtener(id)}`)
      .pipe(
        tap(playlist => {
          this._playlistActual.next(playlist);
          this._estaCargando.next(false);
          this.actualizarEstado({ playlistActual: playlist, estaCargando: false });
          console.log('Playlist cargada:', playlist.titulo);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
  }

  crearPlaylist(datosPlaylist: CrearPlaylistDto): Observable<PlaylistDto> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();
      const params = new HttpParams().set('usuarioId', usuarioId.toString());

      return this.http.post<PlaylistDto>(`${this.urlApi}${this.endpoints.crear}`, datosPlaylist, { params })
        .pipe(
          tap(nuevaPlaylist => {
            const playlistsActuales = this._playlists.value;
            const playlistsActualizadas = [...playlistsActuales, nuevaPlaylist];
            this._playlists.next(playlistsActualizadas);
            this._estaCargando.next(false);
            this.actualizarEstado({
              playlists: playlistsActualizadas,
              estaCargando: false
            });
            console.log('Playlist creada exitosamente:', nuevaPlaylist.titulo);
          }),
          catchError(error => {
            const mensajeError = this.manejarError(error);
            this._error.next(mensajeError);
            this._estaCargando.next(false);
            this.actualizarEstado({ estaCargando: false, error: mensajeError });
            return throwError(() => error);
          })
        );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }


  actualizarPlaylist(id: number, datosActualizacion: ActualizarPlaylistDto): Observable<PlaylistDto> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();
      const params = new HttpParams().set('usuarioId', usuarioId.toString());

      return this.http.put<PlaylistDto>(`${this.urlApi}${this.endpoints.actualizar(id)}`, datosActualizacion, { params })
        .pipe(
          tap(playlistActualizada => {
            const playlistsActuales = this._playlists.value;
            const playlistsActualizadas = playlistsActuales.map(p =>
              p.listaId === id ? playlistActualizada : p
            );
            this._playlists.next(playlistsActualizadas);

            if (this._playlistActual.value?.listaId === id) {
              this._playlistActual.next(playlistActualizada);
            }

            this._estaCargando.next(false);
            this.actualizarEstado({
              playlists: playlistsActualizadas,
              playlistActual: this._playlistActual.value?.listaId === id ? playlistActualizada : this.estado().playlistActual,
              estaCargando: false
            });
            console.log('Playlist actualizada exitosamente:', playlistActualizada.titulo);
          }),
          catchError(error => {
            const mensajeError = this.manejarError(error);
            this._error.next(mensajeError);
            this._estaCargando.next(false);
            this.actualizarEstado({ estaCargando: false, error: mensajeError });
            return throwError(() => error);
          })
        );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  eliminarPlaylist(id: number): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();
      const params = new HttpParams().set('usuarioId', usuarioId.toString());

      return this.http.delete<RespuestaOperacionPlaylist>(`${this.urlApi}${this.endpoints.eliminar(id)}`, { params })
        .pipe(
          tap(() => {
            const playlistsActuales = this._playlists.value;
            const playlistsActualizadas = playlistsActuales.filter(p => p.listaId !== id);
            this._playlists.next(playlistsActualizadas);

            if (this._playlistActual.value?.listaId === id) {
              this._playlistActual.next(null);
            }

            this._estaCargando.next(false);
            this.actualizarEstado({
              playlists: playlistsActualizadas,
              playlistActual: this._playlistActual.value?.listaId === id ? null : this.estado().playlistActual,
              estaCargando: false
            });
            console.log('Playlist eliminada exitosamente');
          }),
          catchError(error => {
            const mensajeError = this.manejarError(error);
            this._error.next(mensajeError);
            this._estaCargando.next(false);
            this.actualizarEstado({ estaCargando: false, error: mensajeError });
            return throwError(() => error);
          })
        );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }


  obtenerCancionesPlaylist(listaId: number): Observable<CancionPlaylistDto[]> {
    this._estaCargando.next(true);
    this._error.next(null);

    return this.http.get<CancionPlaylistDto[]>(`${this.urlApi}${this.endpoints.canciones.obtener(listaId)}`)
      .pipe(
        tap(canciones => {
          this._cancionesPlaylist.next(canciones);
          this._estaCargando.next(false);
          this.actualizarEstado({ cancionesPlaylist: canciones, estaCargando: false });
          console.log(`Canciones cargadas: ${canciones.length}`);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
  }

  agregarCancionPorVideoId(listaId: number, videoId: string, usuarioId?: number): Observable<CancionPlaylistDto> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const userId = usuarioId || this.obtenerUsuarioId();
      const params = new HttpParams()
        .set('videoId', videoId)
        .set('usuarioId', userId.toString());

      return this.http.post<CancionPlaylistDto>(
        `${this.urlApi}${this.endpoints.canciones.agregar(listaId)}`,
        null,
        { params }
      ).pipe(
        tap(cancionAgregada => {
          const cancionesActuales = this._cancionesPlaylist.value;
          this._cancionesPlaylist.next([...cancionesActuales, cancionAgregada]);
          this._estaCargando.next(false);
          this.actualizarEstado({
            cancionesPlaylist: [...cancionesActuales, cancionAgregada],
            estaCargando: false
          });
          console.log('Canción agregada exitosamente:', cancionAgregada.titulo);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  agregarPistaPrincipal(listaId: number, pistaId: number, usuarioId?: number): Observable<CancionPlaylistDto> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const userId = usuarioId || this.obtenerUsuarioId();
      const params = new HttpParams()
        .set('pistaId', pistaId.toString())
        .set('usuarioId', userId.toString());

      return this.http.post<CancionPlaylistDto>(
        `${this.urlApi}${this.endpoints.canciones.agregarPista(listaId)}`,
        {},
        { params }
      ).pipe(
        tap(cancionAgregada => {
          const cancionesActuales = this._cancionesPlaylist.value;
          this._cancionesPlaylist.next([...cancionesActuales, cancionAgregada]);
          this._estaCargando.next(false);
          this.actualizarEstado({
            cancionesPlaylist: [...cancionesActuales, cancionAgregada],
            estaCargando: false
          });
          console.log('Pista principal agregada exitosamente:', cancionAgregada.titulo);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  eliminarCancion(listaId: number, videoId: string, usuarioId?: number): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const userId = usuarioId || this.obtenerUsuarioId();
      const params = new HttpParams().set('usuarioId', userId.toString());

      return this.http.delete<RespuestaOperacionPlaylist>(
        `${this.urlApi}${this.endpoints.canciones.eliminar(listaId, videoId)}`,
        { params }
      ).pipe(
        tap(() => {
          const cancionesActuales = this._cancionesPlaylist.value;
          const cancionesActualizadas = cancionesActuales.filter(c => c.idVideoYoutube !== videoId);
          this._cancionesPlaylist.next(cancionesActualizadas);
          this._estaCargando.next(false);
          this.actualizarEstado({
            cancionesPlaylist: cancionesActualizadas,
            estaCargando: false
          });
          console.log('Canción eliminada exitosamente');
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  buscarCancionesParaAgregar(listaId: number, consulta: string): Observable<CancionPlaylistDto[]> {
    this._estaCargando.next(true);
    this._error.next(null);

    const params = new HttpParams().set('consulta', consulta);

    return this.http.get<CancionPlaylistDto[]>(`${this.urlApi}${this.endpoints.canciones.buscar(listaId)}`, { params })
      .pipe(
        tap(resultados => {
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false });
          console.log(`Búsqueda completada: ${resultados.length} resultados`);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
  }

  migrarCancionesTemporales(listaId: number): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    return this.http.post<RespuestaOperacionPlaylist>(
      `${this.urlApi}${this.endpoints.canciones.migrarTemporales(listaId)}`,
      {}
    ).pipe(
      tap(respuesta => {
        this._estaCargando.next(false);
        this.actualizarEstado({ estaCargando: false });
        console.log('Migración completada:', respuesta.mensaje);
      }),
      catchError(error => {
        const mensajeError = this.manejarError(error);
        this._error.next(mensajeError);
        this._estaCargando.next(false);
        this.actualizarEstado({ estaCargando: false, error: mensajeError });
        return throwError(() => error);
      })
    );
  }


  obtenerPlaylistsPublicas(): Observable<PlaylistDto[]> {
    this._estaCargando.next(true);
    this._error.next(null);

    return this.http.get<PlaylistDto[]>(`${this.urlApi}${this.endpoints.obtenerPublicas}`)
      .pipe(
        tap(playlistsPublicas => {
          this._playlistsPublicas.next(playlistsPublicas);
          this._estaCargando.next(false);
          this.actualizarEstado({ playlistsPublicas, estaCargando: false });
          console.log(`Playlists públicas cargadas: ${playlistsPublicas.length}`);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
  }

  buscarPlaylists(termino: string): Observable<PlaylistDto[]> {
    this._estaCargando.next(true);
    this._error.next(null);

    const params = new HttpParams().set('termino', termino);

    return this.http.get<PlaylistDto[]>(`${this.urlApi}${this.endpoints.buscar}`, { params })
      .pipe(
        tap(resultados => {
          this._playlistsPublicas.next(resultados);
          this._estaCargando.next(false);
          this.actualizarEstado({ playlistsPublicas: resultados, estaCargando: false });
          console.log(`Búsqueda completada: ${resultados.length} resultados`);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
  }

  cambiarVisibilidad(listaId: number, esPublica: boolean): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();
      const params = new HttpParams()
        .set('usuarioId', usuarioId.toString())
        .set('esPublica', esPublica.toString());

      return this.http.patch<RespuestaOperacionPlaylist>(
        `${this.urlApi}${this.endpoints.cambiarVisibilidad(listaId)}`,
        {},
        { params }
      ).pipe(
        tap(respuesta => {
          const playlistActual = this._playlistActual.value;
          if (playlistActual && playlistActual.listaId === listaId) {
            const playlistActualizada = { ...playlistActual, esPublica };
            this._playlistActual.next(playlistActualizada);
            this.actualizarEstado({ playlistActual: playlistActualizada });
          }

          const playlistsActuales = this._playlists.value;
          const playlistsActualizadas = playlistsActuales.map(p =>
            p.listaId === listaId ? { ...p, esPublica } : p
          );
          this._playlists.next(playlistsActualizadas);

          this._estaCargando.next(false);
          this.actualizarEstado({
            playlists: playlistsActualizadas,
            estaCargando: false
          });
          console.log('Visibilidad actualizada:', respuesta.mensaje);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  cambiarModoColaborativo(listaId: number, esColaborativa: boolean): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();
      const params = new HttpParams()
        .set('usuarioId', usuarioId.toString())
        .set('esColaborativa', esColaborativa.toString());

      return this.http.patch<RespuestaOperacionPlaylist>(
        `${this.urlApi}${this.endpoints.cambiarModoColaborativo(listaId)}`,
        {},
        { params }
      ).pipe(
        tap(respuesta => {
          const playlistActual = this._playlistActual.value;
          if (playlistActual && playlistActual.listaId === listaId) {
            const playlistActualizada = { ...playlistActual, esColaborativa };
            this._playlistActual.next(playlistActualizada);
            this.actualizarEstado({ playlistActual: playlistActualizada });
          }

          const playlistsActuales = this._playlists.value;
          const playlistsActualizadas = playlistsActuales.map(p =>
            p.listaId === listaId ? { ...p, esColaborativa } : p
          );
          this._playlists.next(playlistsActualizadas);

          this._estaCargando.next(false);
          this.actualizarEstado({
            playlists: playlistsActualizadas,
            estaCargando: false
          });
          console.log('Modo colaborativo actualizado:', respuesta.mensaje);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  contarPlaylistsPorUsuario(usuarioId?: number): Observable<ContadorPlaylistDto> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const userId = usuarioId || this.obtenerUsuarioId();

      return this.http.get<ContadorPlaylistDto>(`${this.urlApi}${this.endpoints.contarPorUsuario(userId)}`)
        .pipe(
          tap(contador => {
            this._estaCargando.next(false);
            this.actualizarEstado({ estaCargando: false });
            console.log(`Total de playlists: ${contador.totalListas}`);
          }),
          catchError(error => {
            const mensajeError = this.manejarError(error);
            this._error.next(mensajeError);
            this._estaCargando.next(false);
            this.actualizarEstado({ estaCargando: false, error: mensajeError });
            return throwError(() => error);
          })
        );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  agregarMultiplesCanciones(listaId: number, pistasIds: number[]): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const usuarioId = this.obtenerUsuarioId();
      const params = new HttpParams().set('usuarioId', usuarioId.toString());

      return this.http.post<RespuestaOperacionPlaylist>(
        `${this.urlApi}${this.endpoints.canciones.agregarMultiples(listaId)}`,
        pistasIds,
        { params }
      ).pipe(
        tap(respuesta => {
          this.obtenerCancionesPlaylist(listaId).subscribe();
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false });
          console.log('Canciones múltiples agregadas:', respuesta.mensaje);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  eliminarTodasLasCanciones(listaId: number): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    return this.http.delete<RespuestaOperacionPlaylist>(
      `${this.urlApi}${this.endpoints.canciones.eliminarTodas(listaId)}`
    ).pipe(
      tap(respuesta => {
        this._cancionesPlaylist.next([]);
        this._estaCargando.next(false);
        this.actualizarEstado({
          cancionesPlaylist: [],
          estaCargando: false
        });
        console.log('Todas las canciones eliminadas:', respuesta.mensaje);
      }),
      catchError(error => {
        const mensajeError = this.manejarError(error);
        this._error.next(mensajeError);
        this._estaCargando.next(false);
        this.actualizarEstado({ estaCargando: false, error: mensajeError });
        return throwError(() => error);
      })
    );
  }

  reordenarCancion(listaId: number, videoId: string, nuevaPosicion: number, usuarioId?: number): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    try {
      const userId = usuarioId || this.obtenerUsuarioId();
      const params = new HttpParams()
        .set('nuevaPosicion', nuevaPosicion.toString())
        .set('usuarioId', userId.toString());

      return this.http.put<RespuestaOperacionPlaylist>(
        `${this.urlApi}${this.endpoints.canciones.reordenar(listaId, videoId)}`,
        null,
        { params }
      ).pipe(
        tap(respuesta => {
          this.obtenerCancionesPlaylist(listaId).subscribe();
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false });
          console.log('Canción reordenada:', respuesta.mensaje);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      this._error.next(error.message);
      this._estaCargando.next(false);
      this.actualizarEstado({ estaCargando: false, error: error.message });
      return throwError(() => error);
    }
  }

  /*
  moverCancion(listaId: number, pistaId: number, posicionOrigen: number, posicionDestino: number): Observable<RespuestaOperacionPlaylist> {
    this._estaCargando.next(true);
    this._error.next(null);

    const params = new HttpParams()
      .set('posicionOrigen', posicionOrigen.toString())
      .set('posicionDestino', posicionDestino.toString());

    return this.http.put<RespuestaOperacionPlaylist>(
      `${this.urlApi}${this.endpoints.canciones.mover(listaId, pistaId)}`,
      {},
      { params }
    ).pipe(
      tap(respuesta => {
        this.obtenerCancionesPlaylist(listaId).subscribe();
        this._estaCargando.next(false);
        this.actualizarEstado({ estaCargando: false });
        console.log('Canción movida:', respuesta.mensaje);
      }),
      catchError(error => {
        const mensajeError = this.manejarError(error);
        this._error.next(mensajeError);
        this._estaCargando.next(false);
        this.actualizarEstado({ estaCargando: false, error: mensajeError });
        return throwError(() => error);
      })
    );
  }
  */

  contarCanciones(listaId: number): Observable<{ total: number }> {
    this._error.next(null);

    return this.http.get<{ total: number }>(
      `${this.urlApi}${this.endpoints.canciones.contarTotal(listaId)}`
    ).pipe(
      tap(respuesta => {
        console.log(`[Playlist] Total de canciones: ${respuesta.total}`);
      }),
      catchError(error => {
        const mensajeError = this.manejarError(error);
        this._error.next(mensajeError);
        this.actualizarEstado({ error: mensajeError });
        return throwError(() => error);
      })
    );
  }

  obtenerEstadisticasPlaylist(listaId: number): Observable<any> {

    this._estaCargando.next(true);
    this._error.next(null);

    return this.http.get<any>(`${this.urlApi}${this.endpoints.canciones.estadisticas(listaId)}`)
      .pipe(
        tap(estadisticas => {
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false });
          console.log('Estadísticas obtenidas:', estadisticas);
        }),
        catchError(error => {
          const mensajeError = this.manejarError(error);
          this._error.next(mensajeError);
          this._estaCargando.next(false);
          this.actualizarEstado({ estaCargando: false, error: mensajeError });
          return throwError(() => error);
        })
      );
  }

  limpiarEstado(): void {
    this._playlists.next([]);
    this._playlistActual.next(null);
    this._cancionesPlaylist.next([]);
    this._playlistsPublicas.next([]);
    this._error.next(null);
    this._estaCargando.next(false);
    this.estado.set({
      playlists: [],
      playlistActual: null,
      cancionesPlaylist: [],
      playlistsPublicas: [],
      estaCargando: false,
      error: null
    });
  }

  private actualizarEstado(estadoParcial: Partial<EstadoServicioPlaylist>): void {
    this.estado.update(estadoActual => ({
      ...estadoActual,
      ...estadoParcial
    }));
  }

  private manejarError(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Error: ${error.error.message}`;
    }

    const errorApi = error.error as any;

    switch (error.status) {
      case 400:
        return errorApi?.message || 'Solicitud inválida';
      case 401:
        return 'No autorizado. Por favor, inicia sesión';
      case 403:
        return errorApi?.message || 'No tienes permisos para esta acción';
      case 404:
        return errorApi?.message || 'Recurso no encontrado';
      case 409:
        return errorApi?.message || 'Conflicto en la operación';
      case 500:
        return 'Error del servidor. Intenta más tarde';
      default:
        return `Error ${error.status}: ${errorApi?.message || error.message}`;
    }
  }
}
