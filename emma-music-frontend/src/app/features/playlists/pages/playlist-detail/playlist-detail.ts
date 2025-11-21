import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil, switchMap } from 'rxjs';

import { ServicioPlaylist } from '../../../../domains/playlists/services/playlist.service';
import { ServicioAutenticacion } from '../../../../domains/auth/services/auth.service';
import { ServicioReproduccion } from '../../../../domains/playback/services/playback.service';
import { ServicioNotificaciones } from '../../../../shared/services/notificacion.service';
import { ServicioFavoritos } from '../../../../domains/favorites/services/favoritos.service';
import {
  PlaylistDto,
  CancionPlaylistDto,
  TipoPista
} from '../../../../domains/playlists/models/playlist.model';
import { CancionHibridaDto } from '../../../../domains/youtube/models/youtube-search.model';
import { APP_ICONS } from '../../../../shared/icons/app-icons';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FaIconComponent],
  templateUrl: './playlist-detail.html',
  styleUrls: ['./playlist-detail.scss']
})
export class PlaylistDetail implements OnInit, OnDestroy {

  private servicioPlaylist = inject(ServicioPlaylist);
  private servicioAuth = inject(ServicioAutenticacion);
  private servicioReproduccion = inject(ServicioReproduccion);
  private servicioNotificaciones = inject(ServicioNotificaciones);
  private servicioFavoritos = inject(ServicioFavoritos);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  protected readonly icons = APP_ICONS;
  protected readonly TipoPista = TipoPista;

  protected playlist = signal<PlaylistDto | null>(null);
  protected canciones = signal<CancionPlaylistDto[]>([]);
  protected resultadosBusqueda = signal<CancionPlaylistDto[]>([]);
  protected cancionesEnProceso = signal<Set<string>>(new Set());
  protected cancionesAgregadas = signal<Set<string>>(new Set());
  protected favoritosMap = signal<Map<string, boolean>>(new Map());
  protected isLoading = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected showSearchForm = signal<boolean>(false);
  protected terminoBusqueda = signal<string>('');
  protected esPropietario = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPlaylistFromRoute();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPlaylistFromRoute(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          const playlistId = Number(params['id']);
          if (!playlistId || isNaN(playlistId)) {
            throw new Error('ID de playlist inválido');
          }
          return this.servicioPlaylist.obtenerPlaylistPorId(playlistId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (playlist) => {
          this.verificarPropietario(playlist);
          this.loadCanciones(playlist.listaId);
        },
        error: (error) => {
          console.error('Error cargando playlist:', error);
          this.error.set('No se pudo cargar la playlist');
        }
      });
  }

  private verificarPropietario(playlist: PlaylistDto): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    this.esPropietario.set(usuario?.usuarioId === playlist.usuarioId);
  }

  private loadCanciones(listaId: number): void {
    this.servicioPlaylist.obtenerCancionesPlaylist(listaId).subscribe({
      error: (error) => console.error('Error cargando canciones:', error)
    });
  }

  private setupSubscriptions(): void {
    this.servicioPlaylist.playlistActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playlist => {
        this.playlist.set(playlist);
        if (playlist) {
          this.verificarPropietario(playlist);
        }
      });

    this.servicioPlaylist.cancionesPlaylist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(canciones => {
        this.canciones.set(canciones);
        this.verificarFavoritos(canciones);
      });

    this.servicioPlaylist.estaCargando$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estaCargando => this.isLoading.set(estaCargando));

    this.servicioPlaylist.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error.set(error));
  }

  protected toggleSearchForm(): void {
    this.showSearchForm.update(show => !show);
    if (!this.showSearchForm()) {
      this.resultadosBusqueda.set([]);
      this.terminoBusqueda.set('');
    }
  }

  protected buscarCanciones(): void {
    const playlist = this.playlist();
    const termino = this.terminoBusqueda();

    if (!playlist || !termino.trim()) {
      return;
    }

    this.servicioPlaylist.buscarCancionesParaAgregar(playlist.listaId, termino).subscribe({
      next: (resultados) => this.resultadosBusqueda.set(resultados),
      error: (error) => console.error('Error buscando canciones:', error)
    });
  }

  protected agregarCancionDesdeResultado(cancion: CancionPlaylistDto): void {
    const playlist = this.playlist();
    if (!playlist) return;

    const cancionId = cancion.idVideoYoutube;

    if (this.cancionesEnProceso().has(cancionId)) {
      return;
    }

    if (this.cancionesAgregadas().has(cancionId)) {
      this.servicioNotificaciones.advertencia('Esta canción ya fue agregada');
      return;
    }

    const enProceso = new Set(this.cancionesEnProceso());
    enProceso.add(cancionId);
    this.cancionesEnProceso.set(enProceso);

    const agregarObservable = cancion.idVideoYoutube
      ? this.servicioPlaylist.agregarCancionPorVideoId(playlist.listaId, cancion.idVideoYoutube)
      : null;

    if (!agregarObservable) {
      this.servicioNotificaciones.error('No se puede agregar esta canción');
      const enProceso = new Set(this.cancionesEnProceso());
      enProceso.delete(cancionId);
      this.cancionesEnProceso.set(enProceso);
      return;
    }

    agregarObservable.subscribe({
      next: () => {
        const enProceso = new Set(this.cancionesEnProceso());
        enProceso.delete(cancionId);
        this.cancionesEnProceso.set(enProceso);

        const agregadas = new Set(this.cancionesAgregadas());
        agregadas.add(cancionId);
        this.cancionesAgregadas.set(agregadas);

        this.loadCanciones(playlist.listaId);
        this.servicioNotificaciones.exito(`✓ "${cancion.titulo}" agregada a la playlist`);

        setTimeout(() => {
          const agregadas = new Set(this.cancionesAgregadas());
          agregadas.delete(cancionId);
          this.cancionesAgregadas.set(agregadas);
        }, 2000);
      },
      error: (error) => {
        const enProceso = new Set(this.cancionesEnProceso());
        enProceso.delete(cancionId);
        this.cancionesEnProceso.set(enProceso);

        console.error('Error agregando canción:', error);
        this.servicioNotificaciones.error(
          error.message || 'Error al agregar la canción'
        );
      }
    });
  }

  protected eliminarCancion(cancion: CancionPlaylistDto, event: Event): void {
    event.stopPropagation();

    const playlist = this.playlist();
    if (!playlist) return;

    if (!confirm(`¿Eliminar "${cancion.titulo}" de la playlist?`)) {
      return;
    }

    this.servicioPlaylist.eliminarCancion(playlist.listaId, cancion.idVideoYoutube).subscribe({
      next: () => {
        this.loadCanciones(playlist.listaId);
        console.log('Canción eliminada de la playlist');
      },
      error: (error) => console.error('Error eliminando canción:', error)
    });
  }

  protected cambiarVisibilidad(): void {
    const playlist = this.playlist();
    if (!playlist || !this.esPropietario()) return;

    const nuevaVisibilidad = !playlist.esPublica;

    this.servicioPlaylist.cambiarVisibilidad(playlist.listaId, nuevaVisibilidad).subscribe({
      next: () => console.log('Visibilidad actualizada'),
      error: (error) => console.error('Error cambiando visibilidad:', error)
    });
  }

  protected cambiarModoColaborativo(): void {
    const playlist = this.playlist();
    if (!playlist || !this.esPropietario()) return;

    const nuevoModo = !playlist.esColaborativa;

    this.servicioPlaylist.cambiarModoColaborativo(playlist.listaId, nuevoModo).subscribe({
      next: () => console.log('Modo colaborativo actualizado'),
      error: (error) => console.error('Error cambiando modo colaborativo:', error)
    });
  }

  protected migrarCancionesTemporales(): void {
    const playlist = this.playlist();
    if (!playlist || !this.esPropietario()) return;

    if (!confirm('¿Migrar canciones temporales populares a pistas principales?')) {
      return;
    }

    this.servicioPlaylist.migrarCancionesTemporales(playlist.listaId).subscribe({
      next: () => {
        this.loadCanciones(playlist.listaId);
        console.log('Migración completada');
      },
      error: (error) => console.error('Error en migración:', error)
    });
  }

  protected obtenerIconoTipoPista(tipo: TipoPista): any {
    switch (tipo) {
      case TipoPista.PRINCIPAL:
        return this.icons.music;
      case TipoPista.TEMPORAL:
        return this.icons.clock;
      case TipoPista.YOUTUBE:
        return this.icons.play;
      default:
        return this.icons.music;
    }
  }

  protected obtenerEtiquetaTipoPista(tipo: TipoPista): string {
    switch (tipo) {
      case TipoPista.PRINCIPAL:
        return 'Descargada';
      case TipoPista.TEMPORAL:
        return 'En línea';
      case TipoPista.YOUTUBE:
        return 'En línea';
      default:
        return 'En línea';
    }
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

  protected reproducirCancion(cancion: CancionPlaylistDto, indice: number): void {
    if (!cancion.idVideoYoutube || cancion.idVideoYoutube.trim() === '') {
      this.servicioNotificaciones.advertencia('Esta canción no tiene un ID de video válido');
      console.warn('La canción no tiene ID de video de YouTube:', cancion);
      return;
    }

    const cancionHibrida: CancionHibridaDto = this.convertirACancionHibrida(cancion);
    const todasLasCanciones = this.canciones()
      .filter(c => c.idVideoYoutube && c.idVideoYoutube.trim() !== '')
      .map(c => this.convertirACancionHibrida(c));

    if (todasLasCanciones.length === 0) {
      this.servicioNotificaciones.error('No hay canciones con ID de video válido');
      return;
    }

    const indiceReal = todasLasCanciones.findIndex(c => c.id_video === cancion.idVideoYoutube);
    const indiceAReproducir = indiceReal >= 0 ? indiceReal : 0;

    this.servicioReproduccion.reproducirPlaylist(todasLasCanciones, indiceAReproducir);
    this.servicioNotificaciones.info(`Reproduciendo "${cancion.titulo}"`);
  }

  protected reproducirPlaylist(): void {
    const canciones = this.canciones().filter(c => c.idVideoYoutube && c.idVideoYoutube.trim() !== '');

    if (canciones.length === 0) {
      this.servicioNotificaciones.advertencia('No hay canciones con ID de video válido para reproducir');
      console.warn('No hay canciones en la playlist');
      return;
    }

    const playlist = this.playlist();
    const cancionesHibridas = canciones.map(c => this.convertirACancionHibrida(c));

    this.servicioReproduccion.reproducirPlaylist(cancionesHibridas, 0);
    this.servicioNotificaciones.exito(`Reproduciendo "${playlist?.titulo || 'Playlist'}"`);
  }

  private convertirACancionHibrida(cancion: CancionPlaylistDto): CancionHibridaDto {
    return {
      id_video: cancion.idVideoYoutube || '',
      titulo: cancion.titulo,
      canal: cancion.canal || 'Desconocido',
      duracion_segundos: cancion.duracionSegundos,
      duracion: cancion.duracionTexto || this.formatearDuracion(cancion.duracionSegundos),
      miniaturas: cancion.miniaturaUrl ? [cancion.miniaturaUrl] : [],
      es_explicito: cancion.esExplicito,
      artistas: []
    };
  }

  protected formatearDuracionTotal(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }

  protected formatearFechaCreacion(fechaString: string): string {
    return new Date(fechaString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  protected formatearFechaActualizacion(fechaString: string): string {
    return new Date(fechaString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected clearError(): void {
    this.error.set(null);
  }

  protected onTerminoBusquedaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
  }

  protected onBuscarSubmit(event: Event): void {
    event.preventDefault();
    this.buscarCanciones();
  }

  protected cancionEstaEnProceso(identificador: string): boolean {
    return this.cancionesEnProceso().has(identificador);
  }

  protected cancionFueAgregada(identificador: string): boolean {
    return this.cancionesAgregadas().has(identificador);
  }

  protected reproducirCancionDesdeBusqueda(cancion: CancionPlaylistDto): void {
    if (!cancion.idVideoYoutube || cancion.idVideoYoutube.trim() === '') {
      this.servicioNotificaciones.advertencia('Esta canción no tiene un ID de video válido');
      return;
    }

    const cancionHibrida = this.convertirACancionHibrida(cancion);
    this.servicioReproduccion.reproducirCancionHibrida(cancionHibrida);
    this.servicioNotificaciones.info(`Reproduciendo "${cancion.titulo}"`);
  }

  private verificarFavoritos(canciones: CancionPlaylistDto[]): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    if (!usuario) return;

    canciones.forEach(cancion => {
      if (cancion.idVideoYoutube) {
        this.servicioFavoritos.verificarFavorito(usuario.usuarioId, cancion.idVideoYoutube)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resultado) => {
              const map = new Map(this.favoritosMap());
              map.set(cancion.idVideoYoutube, resultado.esFavorito);
              this.favoritosMap.set(map);
            },
            error: (error) => console.error('Error verificando favorito:', error)
          });
      }
    });
  }

  protected alternarFavorito(cancion: CancionPlaylistDto, event: Event): void {
    event.stopPropagation();

    const usuario = this.servicioAuth.obtenerUsuarioActual();
    if (!usuario || !cancion.idVideoYoutube) {
      this.servicioNotificaciones.error('No se puede agregar a favoritos');
      return;
    }

    const esFavorito = this.esFavorito(cancion.idVideoYoutube);

    this.servicioFavoritos.alternarFavorito(usuario.usuarioId, cancion.idVideoYoutube, esFavorito)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const map = new Map(this.favoritosMap());
          map.set(cancion.idVideoYoutube, !esFavorito);
          this.favoritosMap.set(map);

          this.servicioNotificaciones.exito(
            esFavorito
              ? `"${cancion.titulo}" eliminada de favoritos`
              : `"${cancion.titulo}" agregada a favoritos`
          );
        },
        error: (error) => {
          console.error('Error alternando favorito:', error);
          this.servicioNotificaciones.error('Error al actualizar favoritos');
        }
      });
  }

  protected esFavorito(idVideoYoutube: string): boolean {
    return this.favoritosMap().get(idVideoYoutube) ?? false;
  }
}
