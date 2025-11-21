import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil } from 'rxjs';

import { ServicioAutenticacion, DtoRespuestaUsuario } from '../../../../domains/auth/services/auth.service';
import { ServicioPlaylist } from '../../../../domains/playlists/services/playlist.service';
import { ServicioFavoritos } from '../../../../domains/favorites/services/favoritos.service';
import { ServicioReproduccion } from '../../../../domains/playback/services/playback.service';
import { CancionHibridaDto } from '../../../../domains/youtube/models/youtube-search.model';
import { FavoritoHibridoDto } from '../../../../domains/favorites/models/favorito.model';
import { PlaylistDto } from '../../../../domains/playlists/models/playlist.model';
import { APP_ICONS } from '../../../../shared/icons/app-icons';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio implements OnInit, OnDestroy {

  private servicioAutenticacion = inject(ServicioAutenticacion);
  private servicioPlaylist = inject(ServicioPlaylist);
  private servicioFavoritos = inject(ServicioFavoritos);
  private servicioReproduccion = inject(ServicioReproduccion);
  private destroy$ = new Subject<void>();

  protected readonly iconos = APP_ICONS;

  protected usuario = signal<DtoRespuestaUsuario | null>(null);
  protected playlists = signal<PlaylistDto[]>([]);
  protected cancionesFavoritas = signal<FavoritoHibridoDto[]>([]);
  protected estaCargando = signal<boolean>(false);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarDatos();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.servicioAutenticacion.usuarioActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        this.usuario.set(usuario);
        if (usuario) {
          this.cargarDatos();
        }
      });

    this.servicioPlaylist.playlists$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playlists => {
        this.playlists.set(playlists);
      });
  }

  private cargarUsuario(): void {
    const usuario = this.servicioAutenticacion.obtenerUsuarioActual();
    this.usuario.set(usuario);
  }

  private cargarDatos(): void {
    const usuario = this.usuario();
    if (!usuario) return;

    this.estaCargando.set(true);
    this.error.set(null);

    this.servicioPlaylist.obtenerMisPlaylists().subscribe({
      next: () => {
        this.estaCargando.set(false);
      },
      error: (err) => {
        if (err.status !== 404) {
          console.error('Error cargando playlists:', err);
        }
        this.estaCargando.set(false);
      }
    });

    this.servicioFavoritos.obtenerFavoritosPorUsuario(usuario.usuarioId).subscribe({
      next: (respuesta) => {
        const favoritos = respuesta.favoritos || [];
        this.cancionesFavoritas.set(favoritos.slice(0, 10));
        this.estaCargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando favoritas:', err);
        this.cancionesFavoritas.set([]);
        this.estaCargando.set(false);
      }
    });
  }

  protected obtenerSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  protected obtenerNombreUsuario(): string {
    const usuario = this.usuario();
    if (!usuario) return '';

    if (usuario.nombre) {
      return usuario.nombre;
    }
    return usuario.nombreUsuario;
  }

  protected reproducirPlaylist(playlist: PlaylistDto): void {
    if (playlist.totalCanciones === 0) {
      console.warn('La playlist está vacía');
      return;
    }

    this.servicioPlaylist.obtenerCancionesPlaylist(playlist.listaId).subscribe({
      next: (canciones) => {
        if (canciones.length === 0) {
          console.warn('No hay canciones para reproducir');
          return;
        }

        const cancionesHibridas: CancionHibridaDto[] = canciones.map(c => ({
          id_video: c.idVideoYoutube || '',
          titulo: c.titulo,
          canal: c.canal || 'Desconocido',
          duracion_segundos: c.duracionSegundos,
          duracion: c.duracionTexto || '',
          miniaturas: c.miniaturaUrl ? [c.miniaturaUrl] : [],
          es_explicito: c.esExplicito,
          artistas: []
        }));

        this.servicioReproduccion.reproducirPlaylist(cancionesHibridas, 0);
        console.log('Reproduciendo playlist:', playlist.titulo);
      },
      error: (error) => {
        console.error('Error cargando canciones de la playlist:', error);
      }
    });
  }

  protected reproducirFavorita(favorito: FavoritoHibridoDto): void {
    if (!favorito.idVideoYoutube) {
      console.warn('El favorito no tiene ID de YouTube');
      return;
    }

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

  protected obtenerImagenPlaylist(playlist: PlaylistDto): string {
    if (playlist.urlImagenPortada) {
      return playlist.urlImagenPortada;
    }
    return '';
  }

  protected obtenerImagenPista(favorito: FavoritoHibridoDto): string {
    if (favorito.miniaturaUrl) {
      return favorito.miniaturaUrl;
    }
    if (favorito.idVideoYoutube) {
      return `https://i.ytimg.com/vi/${favorito.idVideoYoutube}/default.jpg`;
    }
    return '';
  }

  protected onErrorImagen(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
