import { Injectable, inject, signal, computed } from '@angular/core';
import { BehaviorSubject, interval, firstValueFrom } from 'rxjs';
import { ServicioReproductorBackend } from './reproductor-backend.service';
import { ServicioColaBackend } from './cola-backend.service';
import { ServicioAutenticacion } from '../../auth/services/auth.service';
import { ServicioReproductorWebSocket } from './reproductor-websocket.service';
import { ServicioHistorial } from '../../historial/services/historial.service';
import { RegistrarReproduccionRequest } from '../../historial/models/historial.model';
import {
    EstadoReproductorDto,
    ColaReproduccionDto,
    ModoReproduccion,
    AgregarAColaRequest,
    TipoEventoWebSocket
} from '../models/reproductor-backend.model';

@Injectable({
    providedIn: 'root'
})
export class ServicioReproductorIntegrado {
    private servicioReproductorBackend = inject(ServicioReproductorBackend);
    private servicioColaBackend = inject(ServicioColaBackend);
    private servicioAutenticacion = inject(ServicioAutenticacion);
    private servicioWebSocket = inject(ServicioReproductorWebSocket);
    private servicioHistorial = inject(ServicioHistorial);

    private audio = new Audio();
    private sincronizando = false;

    private _estadoReproductor = new BehaviorSubject<EstadoReproductorDto | null>(null);
    public estadoReproductor$ = this._estadoReproductor.asObservable();

    private _colaReproduccion = new BehaviorSubject<ColaReproduccionDto | null>(null);
    public colaReproduccion$ = this._colaReproduccion.asObservable();

    private _estadoLocal = signal({
        tiempoActual: 0,
        duracion: 0,
        volumen: 80,
        estaMuteado: false,
        estaCargando: false,
        error: null as string | null
    });

    public estadoLocal = this._estadoLocal.asReadonly();

    public progreso = computed(() => {
        const duracion = this._estadoLocal().duracion;
        if (duracion === 0) return 0;
        return (this._estadoLocal().tiempoActual / duracion) * 100;
    });

    public tiempoFormateado = computed(() => {
        return this.formatearTiempo(this._estadoLocal().tiempoActual);
    });

    public duracionFormateada = computed(() => {
        return this.formatearTiempo(this._estadoLocal().duracion);
    });

    constructor() {
        this.configurarEventosAudio();
        this.inicializarSincronizacion();
        this.configurarWebSocket();
    }

    private configurarWebSocket(): void {
        this.servicioWebSocket.obtenerMensajes().subscribe(mensaje => {
            this.procesarMensajeWebSocket(mensaje);
        });

        this.servicioWebSocket.obtenerEstadoConexion().subscribe(conectado => {
            console.log('Estado conexión WebSocket:', conectado ? 'Conectado' : 'Desconectado');
        });
    }

    private procesarMensajeWebSocket(mensaje: any): void {
        console.log('[WebSocket] Procesando mensaje:', {
            tipoEvento: mensaje.tipo,
            tieneEstado: !!mensaje.estado,
            tieneUrl: !!mensaje.estado?.urlReproduccion
        });

        switch (mensaje.tipo) {
            case TipoEventoWebSocket.REPRODUCIENDO:
                console.log('[WebSocket] REPRODUCIENDO - Estado inicial');
                this._estadoLocal.update(s => ({ ...s, estaCargando: true }));
                if (mensaje.estadoReproductor) {
                    this._estadoReproductor.next(mensaje.estadoReproductor);
                }
                break;
            case 'LISTO': // Fallback for the old event type
            case TipoEventoWebSocket.STREAM_LISTO:
                console.log('[WebSocket] STREAM_LISTO - URL lista para reproducir');
                console.log('[WebSocket] Payload completo:', mensaje);

                this._estadoLocal.update(s => ({ ...s, estaCargando: false, error: null }));
                if (mensaje.estado) {
                    this._estadoReproductor.next(mensaje.estado);

                    if (mensaje.estado.urlReproduccion) {
                        console.log('[WebSocket] Iniciando reproducción de audio con URL:',
                            mensaje.estado.urlReproduccion);
                        this.cargarYReproducirAudio(mensaje.estado.urlReproduccion);
                    } else {
                        console.warn('[WebSocket] STREAM_LISTO recibido pero sin URL de reproducción');
                    }
                } else {
                    console.warn('[WebSocket] STREAM_LISTO recibido pero sin estado');
                }
                break;

            case TipoEventoWebSocket.PAUSADO:
                console.log('[WebSocket] PAUSADO');
                if (mensaje.estadoReproductor) {
                    this._estadoReproductor.next(mensaje.estadoReproductor);
                    this.audio.pause();
                }
                break;

            case TipoEventoWebSocket.SIGUIENTE:
            case TipoEventoWebSocket.ANTERIOR:
                console.log('[WebSocket] Cambiando canción');
                this._estadoLocal.update(s => ({ ...s, estaCargando: true }));
                break;

            case TipoEventoWebSocket.ACTUALIZACION_COLA:
                console.log('[WebSocket] ACTUALIZACION_COLA');
                if (mensaje.estadoReproductor) {
                    this._estadoReproductor.next(mensaje.estadoReproductor);

                    if (!mensaje.estadoReproductor.estaReproduciendo) {
                        this.audio.pause();
                    } else if (this.audio.paused && mensaje.estadoReproductor.urlReproduccion) {
                        // Si debería estar reproduciendo pero está pausado, intentar reproducir
                        this.audio.play().catch(e => console.error('Error al reanudar reproducción:', e));
                    }
                }
                // Actualizar cola si es necesario (podría estar incluido en el estado o requerir fetch separado)
                // Por ahora asumimos que ACTUALIZADO trae el estado del reproductor, no la cola completa.
                // Si el backend envía ACTUALIZACION_COLA como un tipo separado en el futuro, lo manejaremos.
                // Según la guía, ACTUALIZADO es para cambios de estado.
                break;

            case TipoEventoWebSocket.ERROR:
                console.error('[WebSocket] ERROR del servidor:', mensaje.mensaje);
                this._estadoLocal.update(s => ({
                    ...s,
                    estaCargando: false,
                    error: mensaje.mensaje || 'Error desconocido'
                }));
                break;

            default:
                console.warn('[WebSocket] Tipo de evento desconocido:', mensaje.tipo);
        }
    }

    private async cargarYReproducirAudio(url: string): Promise<void> {
        console.log('[Audio] Iniciando carga de audio...');
        console.log('[Audio] URL recibida:', url);

        // Convertir URL relativa a absoluta si es necesario
        let urlAbsoluta = url;
        if (url.startsWith('/')) {
            // URL relativa, agregar la URL base del backend
            const urlBase = this.servicioReproductorBackend['urlApi'] || 'http://localhost:8080';
            urlAbsoluta = `${urlBase}${url}`;
            console.log('[Audio] URL convertida a absoluta:', urlAbsoluta);
        }

        try {
            console.log('[Audio] Cargando audio...');
            await this.cargarAudio(urlAbsoluta);
            console.log('[Audio] Audio cargado exitosamente');

            console.log('[Audio] Intentando reproducir...');
            await this.audio.play();
            console.log('[Audio] Reproducción iniciada exitosamente');

        } catch (error: any) {
            console.error('[Audio] Error al reproducir:', {
                nombre: error.name,
                mensaje: error.message,
                error: error
            });

            this._estadoLocal.update(s => ({
                ...s,
                estaCargando: false,
                error: 'Error al reproducir audio: ' + error.message
            }));
        }
    }

    private async actualizarCola(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            const cola = await firstValueFrom(
                this.servicioColaBackend.obtenerCola(usuarioId)
            );
            this._colaReproduccion.next(cola);
        } catch (error) {
            console.error('Error actualizando cola:', error);
        }
    }

    private configurarEventosAudio(): void {
        this.audio.addEventListener('timeupdate', () => {
            this._estadoLocal.update(s => ({
                ...s,
                tiempoActual: this.audio.currentTime
            }));
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this._estadoLocal.update(s => ({
                ...s,
                duracion: this.audio.duration,
                estaCargando: false
            }));
        });

        this.audio.addEventListener('ended', () => {
            this.siguiente();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Error en el audio:', e);
            this._estadoLocal.update(s => ({
                ...s,
                estaCargando: false,
                error: 'Error al cargar el audio'
            }));
        });

        this.audio.addEventListener('waiting', () => {
            this._estadoLocal.update(s => ({ ...s, estaCargando: true }));
        });

        this.audio.addEventListener('playing', () => {
            this._estadoLocal.update(s => ({ ...s, estaCargando: false }));
        });
    }

    private inicializarSincronizacion(): void {
        interval(10000).subscribe(() => {
            const usuarioId = this.obtenerUsuarioId();
            if (usuarioId && !this.sincronizando) {
                this.sincronizarEstadoConBackend(usuarioId);
            }
        });
    }

    async inicializar(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) {
            console.warn('No hay usuario autenticado');
            return;
        }

        this.servicioWebSocket.conectar(usuarioId);

        try {
            const estado = await firstValueFrom(
                this.servicioReproductorBackend.obtenerEstado(usuarioId)
            );
            this._estadoReproductor.next(estado);

            if (estado.urlReproduccion) {
                await this.cargarAudio(estado.urlReproduccion);
                this.audio.currentTime = estado.posicionSegundos;

                if (estado.estaReproduciendo) {
                    await this.audio.play();
                }
            }

            const cola = await firstValueFrom(
                this.servicioColaBackend.obtenerCola(usuarioId)
            );
            this._colaReproduccion.next(cola);

        } catch (error) {
            console.error('Error al inicializar reproductor:', error);
        }
    }

    async reproducir(videoId: string): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) {
            console.warn('No hay usuario autenticado');
            return;
        }

        try {
            this._estadoLocal.update(s => ({ ...s, estaCargando: true, error: null }));

            const estado = await firstValueFrom(
                this.servicioReproductorBackend.reproducir(videoId, usuarioId)
            );

            console.log('Solicitud de reproducción enviada. Estado inicial recibido.');
            this._estadoReproductor.next(estado);

        } catch (error) {
            console.error('Error al reproducir:', error);
            this._estadoLocal.update(s => ({
                ...s,
                estaCargando: false,
                error: 'Error al reproducir la canción'
            }));
        }
    }

    async reproducirDesdeBusqueda(
        videoId: string,
        terminoBusqueda: string,
        indiceEnBusqueda: number
    ): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) {
            console.warn('No hay usuario autenticado');
            return;
        }

        try {
            this._estadoLocal.update(s => ({ ...s, estaCargando: true, error: null }));

            const estado = await firstValueFrom(
                this.servicioReproductorBackend.reproducirDesdeBusqueda(
                    usuarioId,
                    videoId,
                    terminoBusqueda,
                    indiceEnBusqueda
                )
            );

            console.log('Reproduciendo desde búsqueda:', {
                termino: terminoBusqueda,
                indice: indiceEnBusqueda,
                totalEnCola: estado.totalEnCola
            });

            this._estadoReproductor.next(estado);

        } catch (error) {
            console.error('Error al reproducir desde búsqueda:', error);
            this._estadoLocal.update(s => ({
                ...s,
                estaCargando: false,
                error: 'Error al reproducir la canción desde búsqueda'
            }));
        }
    }

    async toggleReproduccion(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        const estadoActual = this._estadoReproductor.value;
        if (!estadoActual) return;

        try {
            let nuevoEstado: EstadoReproductorDto;

            if (estadoActual.estaReproduciendo) {
                this.audio.pause();
                nuevoEstado = await firstValueFrom(
                    this.servicioReproductorBackend.pause(usuarioId)
                );
            } else {
                await this.audio.play();
                nuevoEstado = await firstValueFrom(
                    this.servicioReproductorBackend.play(usuarioId)
                );
            }

            this._estadoReproductor.next(nuevoEstado);

        } catch (error) {
            console.error('Error al cambiar reproducción:', error);
        }
    }

    async siguiente(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            this._estadoLocal.update(s => ({ ...s, estaCargando: true }));

            await firstValueFrom(
                this.servicioReproductorBackend.siguiente(usuarioId)
            );

            console.log('Solicitud de siguiente canción enviada');

        } catch (error) {
            console.error('Error al avanzar a siguiente:', error);
            this._estadoLocal.update(s => ({ ...s, estaCargando: false }));
        }
    }

    async anterior(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            this._estadoLocal.update(s => ({ ...s, estaCargando: true }));

            await firstValueFrom(
                this.servicioReproductorBackend.anterior(usuarioId)
            );

            console.log('Solicitud de canción anterior enviada');

        } catch (error) {
            console.error('Error al retroceder a anterior:', error);
            this._estadoLocal.update(s => ({ ...s, estaCargando: false }));
        }
    }

    async cambiarPosicion(posicionSegundos: number): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        this.audio.currentTime = posicionSegundos;

        try {
            await firstValueFrom(
                this.servicioReproductorBackend.saltarPosicion(usuarioId, posicionSegundos)
            );
        } catch (error) {
            console.error('Error al sincronizar posición:', error);
        }
    }

    async cambiarVolumen(volumen: number): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        const volumenNormalizado = Math.max(0, Math.min(100, volumen));
        this.audio.volume = volumenNormalizado / 100;

        this._estadoLocal.update(s => ({
            ...s,
            volumen: volumenNormalizado,
            estaMuteado: volumenNormalizado === 0
        }));

        try {
            await firstValueFrom(
                this.servicioReproductorBackend.cambiarVolumen(usuarioId, volumenNormalizado)
            );
        } catch (error) {
            console.error('Error al sincronizar volumen:', error);
        }
    }

    toggleMute(): void {
        const estadoActual = this._estadoLocal();
        this.audio.muted = !estadoActual.estaMuteado;
        this._estadoLocal.update(s => ({ ...s, estaMuteado: !s.estaMuteado }));
    }

    async toggleFavorito(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        const estadoActual = this._estadoReproductor.value;

        if (!usuarioId || !estadoActual || !estadoActual.videoIdActual) {
            console.warn('No se puede cambiar favorito: falta información');
            return;
        }

        try {
            const respuesta = await firstValueFrom(
                this.servicioReproductorBackend.toggleFavorito(usuarioId)
            );

            this._estadoReproductor.next(respuesta.estado);

            console.log('[toggleFavorito] Favorito cambiado exitosamente:', {
                mensaje: respuesta.mensaje,
                videoId: respuesta.estado.videoIdActual,
                esFavorita: respuesta.esFavorita
            });
        } catch (error) {
            console.error('Error al cambiar favorito:', error);
        }
    }

    async agregarACola(videoIds: string[], reproducirAhora: boolean = false): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            const request: AgregarAColaRequest = {
                usuarioId,
                videoIds,
                reproducirAhora
            };

            const respuesta = await firstValueFrom(
                this.servicioColaBackend.agregarACola(request)
            );

            this._colaReproduccion.next(respuesta.cola);

            console.log('[agregarACola] Canciones agregadas:', respuesta.mensaje);

        } catch (error) {
            console.error('Error al agregar a cola:', error);
        }
    }

    async eliminarDeCola(indice: number): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            const respuesta = await firstValueFrom(
                this.servicioColaBackend.eliminarCancion(usuarioId, indice)
            );

            this._colaReproduccion.next(respuesta.cola);

            console.log('[eliminarDeCola] Canción eliminada:', respuesta.mensaje);

        } catch (error) {
            console.error('Error al eliminar de cola:', error);
        }
    }

    async limpiarCola(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            const respuesta = await firstValueFrom(
                this.servicioColaBackend.limpiarCola(usuarioId)
            );

            this._colaReproduccion.next(null);
            this.audio.pause();
            this.audio.src = '';
            this._estadoReproductor.next(null);

            console.log('[limpiarCola] Cola limpiada:', respuesta.mensaje);

        } catch (error) {
            console.error('Error al limpiar cola:', error);
        }
    }

    async cambiarModo(modo: ModoReproduccion): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        if (!usuarioId) return;

        try {
            const respuesta = await firstValueFrom(
                this.servicioColaBackend.cambiarModo({ usuarioId, modo })
            );

            this._colaReproduccion.next(respuesta.cola);

            console.log('[cambiarModo] Modo cambiado:', respuesta.mensaje);

        } catch (error) {
            console.error('Error al cambiar modo:', error);
        }
    }

    private async cargarAudio(url: string): Promise<void> {
        console.log('[cargarAudio] Iniciando carga...');

        return new Promise((resolve, reject) => {
            console.log('[cargarAudio] Asignando URL al elemento audio');
            this.audio.src = url;
            this.audio.load();
            console.log('[cargarAudio] load() llamado');

            const onLoadedData = () => {
                console.log('[cargarAudio] loadeddata event - Audio cargado exitosamente');
                cleanup();
                resolve();
            };

            const onLoadedMetadata = () => {
                console.log('[cargarAudio] loadedmetadata event - Metadata cargada');
            };

            const onCanPlay = () => {
                console.log('[cargarAudio] canplay event - Audio listo para reproducir');
            };

            const onError = (e: Event) => {
                const errorDetails = {
                    error: (e.target as HTMLAudioElement).error,
                    src: this.audio.src,
                    networkState: this.audio.networkState,
                    readyState: this.audio.readyState
                };
                console.error('[cargarAudio] Error event:', errorDetails);
                cleanup();
                reject(new Error('Error al cargar audio: ' + JSON.stringify(errorDetails)));
            };

            const cleanup = () => {
                console.log('[cargarAudio] Limpiando event listeners');
                this.audio.removeEventListener('loadeddata', onLoadedData);
                this.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
            };

            this.audio.addEventListener('loadeddata', onLoadedData);
            this.audio.addEventListener('loadedmetadata', onLoadedMetadata);
            this.audio.addEventListener('canplay', onCanPlay);
            this.audio.addEventListener('error', onError);

            setTimeout(() => {
                console.log('[cargarAudio] Timeout alcanzado (5s) - Resolviendo de todas formas');
                cleanup();
                resolve();
            }, 5000);
        });
    }

    private async sincronizarEstadoConBackend(usuarioId: number): Promise<void> {
        if (this.sincronizando) return;

        this.sincronizando = true;

        try {
            const estadoActual = this._estadoReproductor.value;
            if (estadoActual && estadoActual.estaReproduciendo) {
                await firstValueFrom(
                    this.servicioReproductorBackend.saltarPosicion(
                        usuarioId,
                        Math.floor(this.audio.currentTime)
                    )
                );
            }
        } catch (error) {
            console.error('Error al sincronizar estado:', error);
        } finally {
            this.sincronizando = false;
        }
    }

    private obtenerUsuarioId(): number | null {
        const usuario = this.servicioAutenticacion.obtenerUsuarioActual();
        return usuario?.usuarioId ?? null;
    }

    private formatearTiempo(segundos: number): string {
        if (isNaN(segundos) || segundos === 0) return '0:00';
        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = Math.floor(segundos % 60);
        return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
    }

    destruir(): void {
        this.servicioWebSocket.desconectar();
        this.audio.pause();
        this.audio.src = '';
    }
}
