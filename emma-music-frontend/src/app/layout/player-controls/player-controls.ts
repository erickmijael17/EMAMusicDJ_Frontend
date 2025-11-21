import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil } from 'rxjs';
import { ServicioReproductorIntegrado } from '../../domains/playback/services/reproductor-integrado.service';
import { ServicioReproductorWebSocket } from '../../domains/playback/services/reproductor-websocket.service';
import { ServicioAutenticacion } from '../../domains/auth/services/auth.service';
import { APP_ICONS } from '../../shared/icons/app-icons';
import { EstadoReproductorDto, ModoReproduccion } from '../../domains/playback/models/reproductor-backend.model';

@Component({
  selector: 'app-player-controls',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  templateUrl: './player-controls.html',
  styleUrls: ['./player-controls.scss']
})
export class PlayerControls implements OnInit, OnDestroy {
  private servicioReproductor = inject(ServicioReproductorIntegrado);
  private servicioWebSocket = inject(ServicioReproductorWebSocket);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private destroy$ = new Subject<void>();

  protected readonly iconos = APP_ICONS;

  protected estadoReproductor = signal<EstadoReproductorDto | null>(null);
  protected volumen = signal<number>(80);
  protected estaMuteado = signal<boolean>(false);
  protected conectadoWebSocket = signal<boolean>(false);

  protected tiempoActual = this.servicioReproductor.tiempoFormateado;
  protected duracion = this.servicioReproductor.duracionFormateada;
  protected progreso = this.servicioReproductor.progreso;
  protected estadoLocal = this.servicioReproductor.estadoLocal;

  protected iconoVolumen = computed(() => {
    const vol = this.volumen();
    if (this.estaMuteado() || vol === 0) return this.iconos.volumeMute;
    if (vol < 30) return this.iconos.volumeDown;
    return this.iconos.volumeUp;
  });

  protected iconoReproduccion = computed(() => {
    const estado = this.estadoReproductor();
    return estado?.estaReproduciendo ? this.iconos.pause : this.iconos.play;
  });

  protected tienePistaActual = computed(() => {
    return this.estadoReproductor()?.videoIdActual != null;
  });

  protected nombrePista = computed(() => {
    return this.estadoReproductor()?.tituloActual || 'Sin título';
  });

  protected nombreArtista = computed(() => {
    return this.estadoReproductor()?.canalActual || 'Artista desconocido';
  });

  protected miniaturaUrl = computed(() => {
    const estado = this.estadoReproductor();

    if (!estado) {
        return this.imagenPorDefecto();
    }

    const url = estado.miniaturaUrl;

    if (!url || url.trim() === '') {
        if (estado.videoIdActual) {
            return `https://i.ytimg.com/vi/${estado.videoIdActual}/hqdefault.jpg`;
        }
        return this.imagenPorDefecto();
    }

    return url;
  });

  private imagenPorDefecto(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23181818\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23b3b3b3\' font-size=\'32\'%3E♪%3C/text%3E%3C/svg%3E';
  }

  protected onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const estado = this.estadoReproductor();

    if (estado?.videoIdActual && !img.src.includes('data:image/svg')) {
      img.src = `https://i.ytimg.com/vi/${estado.videoIdActual}/default.jpg`;
    } else {
      img.src = this.imagenPorDefecto();
    }
  }

  protected esFavorita = computed(() => {
    return this.estadoReproductor()?.esFavorita || false;
  });

  protected tieneSiguiente = computed(() => {
    return this.estadoReproductor()?.tieneSiguiente || false;
  });

  protected tieneAnterior = computed(() => {
    return this.estadoReproductor()?.tieneAnterior || false;
  });

  protected modoReproduccion = computed(() => {
    return this.estadoReproductor()?.modoReproduccion || ModoReproduccion.NORMAL;
  });

  protected iconoModoReproduccion = computed(() => {
    const modo = this.modoReproduccion();
    switch (modo) {
      case ModoReproduccion.ALEATORIO:
        return this.iconos.shuffle;
      case ModoReproduccion.REPETIR_UNA:
        return this.iconos.repeat;
      case ModoReproduccion.REPETIR_TODAS:
        return this.iconos.repeat;
      default:
        return this.iconos.repeat;
    }
  });

  protected modoReproduccionActivo = computed(() => {
    const modo = this.modoReproduccion();
    return modo !== ModoReproduccion.NORMAL;
  });

  protected esRepetirUna = computed(() => {
    return this.modoReproduccion() === ModoReproduccion.REPETIR_UNA;
  });

  ngOnInit(): void {
    this.servicioReproductor.estadoReproductor$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estado => {
        this.estadoReproductor.set(estado);
        if (estado) {
          this.volumen.set(estado.volumen);
        }
      });

    this.servicioWebSocket.obtenerEstadoConexion()
      .pipe(takeUntil(this.destroy$))
      .subscribe(conectado => {
        this.conectadoWebSocket.set(conectado);
      });

    this.servicioReproductor.inicializar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onAlternarReproduccionPausa(): void {
    this.servicioReproductor.toggleReproduccion();
  }

  protected onBuscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const progreso = Number(input.value);
    const duracion = this.estadoLocal().duracion;
    const posicionSegundos = (progreso / 100) * duracion;
    this.servicioReproductor.cambiarPosicion(posicionSegundos);
  }

  protected onAnterior(): void {
    if (this.tieneAnterior()) {
      this.servicioReproductor.anterior();
    }
  }

  protected onSiguiente(): void {
    if (this.tieneSiguiente()) {
      this.servicioReproductor.siguiente();
    }
  }

  protected toggleModoReproduccion(): void {
    const modoActual = this.modoReproduccion();
    let nuevoModo: ModoReproduccion;

    switch (modoActual) {
      case ModoReproduccion.NORMAL:
        nuevoModo = ModoReproduccion.REPETIR_TODAS;
        break;
      case ModoReproduccion.REPETIR_TODAS:
        nuevoModo = ModoReproduccion.REPETIR_UNA;
        break;
      case ModoReproduccion.REPETIR_UNA:
        nuevoModo = ModoReproduccion.NORMAL;
        break;
      case ModoReproduccion.ALEATORIO:
        nuevoModo = ModoReproduccion.NORMAL;
        break;
      default:
        nuevoModo = ModoReproduccion.NORMAL;
    }

    this.servicioReproductor.cambiarModo(nuevoModo);
  }

  protected toggleShuffle(): void {
    const modoActual = this.modoReproduccion();
    const nuevoModo = modoActual === ModoReproduccion.ALEATORIO
      ? ModoReproduccion.NORMAL
      : ModoReproduccion.ALEATORIO;

    this.servicioReproductor.cambiarModo(nuevoModo);
  }

  protected onCambiarVolumen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevoVolumen = Number(input.value);
    this.volumen.set(nuevoVolumen);
    this.servicioReproductor.cambiarVolumen(nuevoVolumen);

    if (nuevoVolumen > 0 && this.estaMuteado()) {
      this.estaMuteado.set(false);
    }
  }

  protected toggleMute(): void {
    this.servicioReproductor.toggleMute();
    this.estaMuteado.set(!this.estaMuteado());
  }

  protected toggleFavorita(): void {
    this.servicioReproductor.toggleFavorito();
  }
}

