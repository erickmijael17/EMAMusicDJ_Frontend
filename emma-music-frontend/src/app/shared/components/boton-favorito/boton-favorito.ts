import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ServicioFavoritos, ErrorFavorito } from '../../../domains/favorites/services/favoritos.service';

@Component({
  selector: 'app-boton-favorito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boton-favorito.html',
  styleUrls: ['./boton-favorito.scss']
})
export class BotonFavorito implements OnInit, OnDestroy {

  @Input() usuarioId!: number;
  @Input() idVideoYoutube!: string;
  @Input() tamanio: 'pequeno' | 'mediano' | 'grande' = 'mediano';

  protected esFavorito = signal<boolean>(false);
  protected cargando = signal<boolean>(false);
  protected errorInfo = signal<ErrorFavorito | null>(null);
  protected mostrarTooltip = signal<boolean>(false);

  protected tieneError = computed(() => this.errorInfo() !== null);
  protected mensajeError = computed(() => this.errorInfo()?.mensaje || '');
  protected tituloBoton = computed(() => {
    if (this.tieneError()) {
      return this.errorInfo()?.titulo || 'Error';
    }
    return this.esFavorito() ? 'Eliminar de favoritos' : 'Agregar a favoritos';
  });

  private subscripciones: Subscription[] = [];

  constructor(private servicioFavoritos: ServicioFavoritos) {}

  ngOnInit(): void {
    this.verificarEstado();
  }

  ngOnDestroy(): void {
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  private verificarEstado(): void {
    if (!this.usuarioId || !this.idVideoYoutube) {
      console.warn('[BotonFavorito] Faltan datos:', {
        usuarioId: this.usuarioId,
        idVideoYoutube: this.idVideoYoutube
      });
      return;
    }

    const sub = this.servicioFavoritos.verificarFavorito(this.usuarioId, this.idVideoYoutube)
      .subscribe({
        next: (respuesta) => {
          this.esFavorito.set(respuesta.esFavorito);
          console.log('[BotonFavorito] Estado verificado:', this.esFavorito());
        },
        error: (err) => {
          console.warn('[BotonFavorito] Error verificando estado, asumiendo false:', err);
          this.esFavorito.set(false);
        }
      });

    this.subscripciones.push(sub);
  }

  protected alternar(): void {
    if (!this.usuarioId || !this.idVideoYoutube) {
      this.mostrarError({
        status: 0,
        titulo: 'Información no disponible',
        mensaje: 'Información de canción no disponible',
        accion: 'Intenta nuevamente',
        icono: '⚠️'
      });
      return;
    }

    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);
    this.errorInfo.set(null);

    console.log('[BotonFavorito] Toggle iniciado:', {
      usuarioId: this.usuarioId,
      videoId: this.idVideoYoutube,
      esFavoritoActual: this.esFavorito()
    });

    const sub = this.servicioFavoritos.alternarFavorito(
      this.usuarioId,
      this.idVideoYoutube,
      this.esFavorito()
    ).subscribe({
      next: () => {
        this.esFavorito.set(!this.esFavorito());
        this.cargando.set(false);

        const mensaje = this.esFavorito()
          ? 'Agregado a favoritos ❤️'
          : 'Eliminado de favoritos';

        console.log('[BotonFavorito] Toggle exitoso:', mensaje);
      },
      error: (error: ErrorFavorito) => {
        console.error('[BotonFavorito] Error en toggle:', error);
        this.cargando.set(false);
        this.mostrarError(error);

        if (error.status === 500) {
          this.mostrarAlertaEspecial(error);
        }
      }
    });

    this.subscripciones.push(sub);
  }

  private mostrarError(error: ErrorFavorito): void {
    this.errorInfo.set(error);
    this.mostrarTooltip.set(true);

    setTimeout(() => {
      this.errorInfo.set(null);
      this.mostrarTooltip.set(false);
    }, 5000);
  }

  private mostrarAlertaEspecial(error: ErrorFavorito): void {
    const mensaje = `${error.titulo}\n\n${error.mensaje}\n\n${error.accion}`;
    alert(mensaje);
  }

  protected cerrarTooltip(): void {
    this.errorInfo.set(null);
    this.mostrarTooltip.set(false);
  }
}

