import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { ServicioFavoritos } from '../../../../domains/favorites/services/favoritos.service';
import { ServicioPlaylist } from '../../../../domains/playlists/services/playlist.service';
import { ServicioAutenticacion, DtoRespuestaUsuario } from '../../../../domains/auth/services/auth.service';
import { ServicioReproduccion } from '../../../../domains/playback/services/playback.service';
import { CancionHibridaDto } from '../../../../domains/youtube/models/youtube-search.model';
import { FavoritoHibridoDto } from '../../../../domains/favorites/models/favorito.model';
import { PlaylistDto } from '../../../../domains/playlists/models/playlist.model';
import { APP_ICONS } from '../../../../shared/icons/app-icons';
import { EstadisticasBiblioteca } from '../../models/biblioteca-resumen.model';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './biblioteca.html',
  styleUrls: ['./biblioteca.scss']
})
export class Biblioteca implements OnInit, OnDestroy {

  private servicioFavoritos = inject(ServicioFavoritos);
  private servicioPlaylist = inject(ServicioPlaylist);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private servicioReproduccion = inject(ServicioReproduccion);
  private destroy$ = new Subject<void>();

  protected readonly iconos = APP_ICONS;

  protected cancionesFavoritas = signal<FavoritoHibridoDto[]>([]);
  protected playlists = signal<PlaylistDto[]>([]);
  protected estaCargando = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected usuarioActual = signal<DtoRespuestaUsuario | null>(null);

  protected estadisticas = signal<EstadisticasBiblioteca>({
    totalFavoritas: 0,
    totalPlaylists: 0,
    totalDuracion: 0
  });

  ngOnInit(): void {
    console.log('[Biblioteca] Inicializando componente');
    this.cargarUsuarioActual();
    this.cargarDatos();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    console.log('[Biblioteca] Destruyendo componente');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarUsuarioActual(): void {
    const usuario = this.servicioAutenticacion.obtenerUsuarioActual();
    this.usuarioActual.set(usuario);
    console.log('[Biblioteca] Usuario actual:', usuario?.email);
  }

  private setupSubscriptions(): void {
    this.servicioAutenticacion.usuarioActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        this.usuarioActual.set(usuario);
        if (usuario) {
          this.cargarDatos();
        }
      });

    this.servicioPlaylist.playlists$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playlists => {
        this.playlists.set(playlists);
        this.actualizarEstadisticas();
      });
  }

  private cargarDatos(): void {
    const usuario = this.usuarioActual();
    if (!usuario) {
      console.warn('[Biblioteca] No hay usuario autenticado');
      return;
    }

    console.log('[Biblioteca] Cargando datos para usuario:', usuario.usuarioId);
    this.estaCargando.set(true);
    this.error.set(null);

    forkJoin({
      favoritos: this.servicioFavoritos.obtenerFavoritosPorUsuario(usuario.usuarioId),
      playlists: this.servicioPlaylist.obtenerMisPlaylists()
    }).subscribe({
      next: ({ favoritos, playlists }) => {
        console.log('[Biblioteca] Datos cargados:', {
          favoritos: favoritos.favoritos?.length || 0,
          playlists: playlists.length
        });

        this.cancionesFavoritas.set(favoritos.favoritos || []);
        this.playlists.set(playlists);
        this.actualizarEstadisticas();
        this.estaCargando.set(false);
      },
      error: (err) => {
        console.error('[Biblioteca] Error cargando datos:', err);
        this.error.set('Error al cargar tu biblioteca. Por favor, intenta de nuevo.');
        this.estaCargando.set(false);
      }
    });
  }

  private actualizarEstadisticas(): void {
    const favoritas = this.cancionesFavoritas();
    const playlists = this.playlists();

    const totalDuracion = favoritas.reduce((total, pista) => {
      return total + (pista.duracionSegundos || 0);
    }, 0);

    const estadisticas: EstadisticasBiblioteca = {
      totalFavoritas: favoritas.length,
      totalPlaylists: playlists.length,
      totalDuracion
    };

    this.estadisticas.set(estadisticas);
    console.log('[Biblioteca] Estadísticas actualizadas:', estadisticas);
  }

  protected reproducirFavorita(favorito: FavoritoHibridoDto): void {
    if (!favorito.idVideoYoutube) {
      console.warn('[Biblioteca] El favorito no tiene ID de YouTube');
      return;
    }

    console.log('[Biblioteca] Reproduciendo favorito:', favorito.titulo);

    const cancionParaReproducir: CancionHibridaDto = {
      id_video: favorito.idVideoYoutube,
      titulo: favorito.titulo,
      artistas: [],
      duracion_segundos: favorito.duracionSegundos || 0,
      duracion: favorito.duracionTexto || this.formatearDuracion(favorito.duracionSegundos || 0),
      miniaturas: favorito.miniaturaUrl ? [favorito.miniaturaUrl] : [],
      es_explicito: favorito.esExplicito || false,
      canal: favorito.canal || 'Canciones que te gustan'
    };

    this.servicioReproduccion.reproducirPista(cancionParaReproducir);
  }

  protected formatearDuracion(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }

  protected formatearDuracionTotal(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }

  protected onErrorImagen(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = img.parentElement?.querySelector('.imagen-placeholder');
    if (placeholder) {
      (placeholder as HTMLElement).style.display = 'flex';
    }
    img.style.display = 'none';
  }

  protected limpiarError(): void {
    this.error.set(null);
  }

  protected recargar(): void {
    console.log('[Biblioteca] Recargando datos');
    this.cargarDatos();
  }
}
