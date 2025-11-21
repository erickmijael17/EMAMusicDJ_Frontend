import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import { ColaReproduccion } from '../models/playback-state.model';
import { CancionHibridaDto } from '../../youtube/models/youtube-search.model';
import { ServicioReproductorIntegrado } from './reproductor-integrado.service';

export interface EstadoReproduccion {
  pistaActual: CancionHibridaDto | null;
  estaReproduciendo: boolean;
  progreso: number;
  tiempoActual: number;
  duracion: number;
  cola: ColaReproduccion | null;
  tieneSiguiente: boolean;
  tieneAnterior: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioReproduccion {
  private servicioReproductorIntegrado = inject(ServicioReproductorIntegrado);

  private _estado: WritableSignal<EstadoReproduccion> = signal({
    pistaActual: null,
    estaReproduciendo: false,
    progreso: 0,
    tiempoActual: 0,
    duracion: 0,
    cola: null,
    tieneSiguiente: false,
    tieneAnterior: false,
  });

  public readonly estado = this._estado.asReadonly();

  constructor() {
    this.sincronizarConServicioIntegrado();
  }

  private sincronizarConServicioIntegrado(): void {
    this.servicioReproductorIntegrado.estadoReproductor$.subscribe(estadoBackend => {
      if (estadoBackend) {
        const estadoLocal = this.servicioReproductorIntegrado.estadoLocal();

        this._estado.update(s => ({
          ...s,
          pistaActual: this.convertirACancionHibrida(estadoBackend),
          estaReproduciendo: estadoBackend.estaReproduciendo,
          progreso: this.servicioReproductorIntegrado.progreso(),
          tiempoActual: estadoLocal.tiempoActual,
          duracion: estadoLocal.duracion,
          tieneSiguiente: estadoBackend.tieneSiguiente,
          tieneAnterior: estadoBackend.tieneAnterior
        }));
      }
    });
  }

  private convertirACancionHibrida(estadoBackend: any): CancionHibridaDto {
    return {
      id_video: estadoBackend.videoIdActual || '',
      titulo: estadoBackend.tituloActual || '',
      canal: estadoBackend.canalActual,
      duracion: this.formatearDuracion(estadoBackend.duracionSegundos),
      duracion_segundos: estadoBackend.duracionSegundos,
      miniaturas: estadoBackend.miniaturaUrl ? [estadoBackend.miniaturaUrl] : [],
      es_explicito: false,
      artistas: estadoBackend.canalActual ? [{ nombre: estadoBackend.canalActual, id_artista: '' }] : []
    };
  }

  reproducirCancionHibrida(cancion: CancionHibridaDto): void {
    this.servicioReproductorIntegrado.reproducir(cancion.id_video);
  }

  reproducirDesdeBusqueda(
    videoId: string,
    terminoBusqueda: string,
    indiceEnBusqueda: number
  ): void {
    this.servicioReproductorIntegrado.reproducirDesdeBusqueda(
      videoId,
      terminoBusqueda,
      indiceEnBusqueda
    );
  }

  reproducirPista(cancion: CancionHibridaDto): void {
    this.reproducirCancionHibrida(cancion);
  }

  reproducirPlaylist(canciones: CancionHibridaDto[], indiceInicial: number = 0): void {
    if (!canciones || canciones.length === 0) {
      console.warn('No hay canciones para reproducir');
      return;
    }

    const videoIds = canciones.map(c => c.id_video);
    this.servicioReproductorIntegrado.agregarACola(videoIds, true).then(() => {
      console.log('Playlist agregada a la cola y reproduciendo');
    });
  }

  alternarReproduccionPausa(): void {
    this.servicioReproductorIntegrado.toggleReproduccion();
  }

  siguientePista(): void {
    this.servicioReproductorIntegrado.siguiente();
  }

  pistaAnterior(): void {
    this.servicioReproductorIntegrado.anterior();
  }

  buscar(progreso: number): void {
    const duracion = this.servicioReproductorIntegrado.estadoLocal().duracion;
    const posicionSegundos = (progreso / 100) * duracion;
    this.servicioReproductorIntegrado.cambiarPosicion(posicionSegundos);
  }

  cambiarVolumen(volumen: number): void {
    this.servicioReproductorIntegrado.cambiarVolumen(volumen);
  }

  alternarMute(): boolean {
    this.servicioReproductorIntegrado.toggleMute();
    return this.servicioReproductorIntegrado.estadoLocal().estaMuteado;
  }

  private formatearDuracion(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  }
}
