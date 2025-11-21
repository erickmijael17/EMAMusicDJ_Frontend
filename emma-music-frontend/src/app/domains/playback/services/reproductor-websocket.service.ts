import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MensajeWebSocketDto } from '../models/reproductor-backend.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ServicioReproductorWebSocket {

    private clienteStomp: Client | null = null;
    private mensajesSubject = new Subject<MensajeWebSocketDto>();
    private estadoConexionSubject = new BehaviorSubject<boolean>(false);
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;

    obtenerMensajes(): Observable<MensajeWebSocketDto> {
        return this.mensajesSubject.asObservable();
    }

    obtenerEstadoConexion(): Observable<boolean> {
        return this.estadoConexionSubject.asObservable();
    }

    conectar(usuarioId: number): void {
        if (this.clienteStomp?.active) {
            console.log('WebSocket ya está conectado');
            return;
        }

        console.log('Iniciando conexión WebSocket para usuario:', usuarioId);

        const socketFactory = () => {
            return new SockJS(`${environment.apiUrl}/ws`) as WebSocket;
        };

        this.clienteStomp = new Client({
            webSocketFactory: socketFactory,

            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('WebSocket conectado exitosamente');
                this.estadoConexionSubject.next(true);
                this.reconnectAttempts = 0;

                if (this.clienteStomp) {
                    this.clienteStomp.subscribe(
                        `/topic/reproductor/${usuarioId}`,
                        (mensaje: IMessage) => {
                            console.log('[WebSocket Service] Mensaje CRUDO recibido:', mensaje.body);
                            this.procesarMensaje(mensaje);
                        }
                    );
                }
            },

            onDisconnect: () => {
                console.log('WebSocket desconectado');
                this.estadoConexionSubject.next(false);
            },

            onStompError: (frame) => {
                console.error('Error STOMP:', frame.headers['message']);
                console.error('Detalles:', frame.body);
                this.estadoConexionSubject.next(false);

                if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                    this.reconnectAttempts++;
                    console.log(`Intento de reconexión ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`);
                }
            },

            onWebSocketError: (event) => {
                console.error('Error WebSocket:', event);
                this.estadoConexionSubject.next(false);
            },

            debug: (str) => {
                console.log('WebSocket Debug:', str);
            }
        });

        this.clienteStomp.activate();
    }

    desconectar(): void {
        if (this.clienteStomp) {
            console.log('Desconectando WebSocket');
            this.clienteStomp.deactivate();
            this.clienteStomp = null;
            this.estadoConexionSubject.next(false);
        }
    }

    private procesarMensaje(mensaje: IMessage): void {
        try {
            console.log('[WebSocket Service] ========== NUEVO MENSAJE ==========');
            console.log('[WebSocket Service] Mensaje RAW body:', mensaje.body);

            const evento: MensajeWebSocketDto = JSON.parse(mensaje.body);

            console.log('[WebSocket Service] Mensaje PARSEADO:', {
                tipoEvento: evento.tipoEvento,
                tipoValor: typeof evento.tipoEvento,
                tieneEstado: evento.estadoReproductor !== null,
                tieneUrl: evento.estadoReproductor?.urlReproduccion !== null,
                url: evento.estadoReproductor?.urlReproduccion,
                timestamp: new Date(evento.timestamp).toISOString()
            });

            this.mensajesSubject.next(evento);
        } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
        }
    }

    estaConectado(): boolean {
        return this.estadoConexionSubject.value;
    }
}

