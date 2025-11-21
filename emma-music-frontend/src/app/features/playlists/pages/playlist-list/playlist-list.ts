import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil } from 'rxjs';

import { ServicioPlaylist } from '../../../../domains/playlists/services/playlist.service';
import { ServicioReproduccion } from '../../../../domains/playback/services/playback.service';
import {
  PlaylistDto,
  CrearPlaylistDto,
  ContadorPlaylistDto
} from '../../../../domains/playlists/models/playlist.model';
import { CancionHibridaDto } from '../../../../domains/youtube/models/youtube-search.model';
import { APP_ICONS } from '../../../../shared/icons/app-icons';

@Component({
  selector: 'app-playlist-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FaIconComponent],
  templateUrl: './playlist-list.html',
  styleUrls: ['./playlist-list.scss']
})
export class PlaylistList implements OnInit, OnDestroy {

  private servicioPlaylist = inject(ServicioPlaylist);
  private servicioReproduccion = inject(ServicioReproduccion);
  private destroy$ = new Subject<void>();

  protected readonly icons = APP_ICONS;

  protected playlists = signal<PlaylistDto[]>([]);
  protected playlistsPublicas = signal<PlaylistDto[]>([]);
  protected contadorPlaylists = signal<ContadorPlaylistDto | null>(null);
  protected isLoading = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected showCreateForm = signal<boolean>(false);
  protected showPublicPlaylists = signal<boolean>(false);
  protected terminoBusquedaPublica = signal<string>('');

  protected formularioCrearPlaylist = signal<CrearPlaylistDto>({
    titulo: '',
    descripcion: '',
    urlImagenPortada: '',
    esPublica: false,
    esColaborativa: false
  });

  ngOnInit(): void {
    this.loadPlaylists();
    this.loadContador();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.servicioPlaylist.playlists$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playlists => this.playlists.set(playlists));

    this.servicioPlaylist.playlistsPublicas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playlistsPublicas => this.playlistsPublicas.set(playlistsPublicas));

    this.servicioPlaylist.estaCargando$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estaCargando => this.isLoading.set(estaCargando));

    this.servicioPlaylist.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error.set(error));
  }

  private loadPlaylists(): void {
    this.servicioPlaylist.obtenerMisPlaylists().subscribe({
      error: (error) => console.error('Error cargando playlists:', error)
    });
  }

  private loadContador(): void {
    this.servicioPlaylist.contarPlaylistsPorUsuario().subscribe({
      next: (contador) => this.contadorPlaylists.set(contador),
      error: (error) => console.error('Error cargando contador:', error)
    });
  }

  protected toggleCreateForm(): void {
    this.showCreateForm.update(show => !show);
    if (!this.showCreateForm()) {
      this.reiniciarFormularioCrear();
    }
  }

  protected togglePublicPlaylists(): void {
    this.showPublicPlaylists.update(show => !show);
    if (this.showPublicPlaylists() && this.playlistsPublicas().length === 0) {
      this.loadPlaylistsPublicas();
    }
  }

  protected loadPlaylistsPublicas(): void {
    this.servicioPlaylist.obtenerPlaylistsPublicas().subscribe({
      error: (error) => console.error('Error cargando playlists públicas:', error)
    });
  }

  protected buscarPlaylistsPublicas(): void {
    const termino = this.terminoBusquedaPublica();
    if (!termino.trim()) {
      this.loadPlaylistsPublicas();
      return;
    }

    this.servicioPlaylist.buscarPlaylists(termino).subscribe({
      error: (error: any) => console.error('Error buscando playlists:', error)
    });
  }

  protected crearPlaylist(): void {
    const formulario = this.formularioCrearPlaylist();

    if (!formulario.titulo?.trim()) {
      this.error.set('El título de la playlist es obligatorio');
      return;
    }

    this.servicioPlaylist.crearPlaylist(formulario).subscribe({
      next: () => {
        this.toggleCreateForm();
        this.loadContador();
        console.log('Playlist creada exitosamente');
      },
      error: (error) => console.error('Error creando playlist:', error)
    });
  }

  protected eliminarPlaylist(playlist: PlaylistDto, event: Event): void {
    event.stopPropagation();

    if (!confirm(`¿Estás seguro de eliminar la playlist "${playlist.titulo}"?`)) {
      return;
    }

    this.servicioPlaylist.eliminarPlaylist(playlist.listaId).subscribe({
      next: () => {
        this.loadContador();
        console.log('Playlist eliminada exitosamente');
      },
      error: (error) => console.error('Error eliminando playlist:', error)
    });
  }

  protected reproducirPlaylist(playlist: PlaylistDto, event: Event): void {
    event.stopPropagation();

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

  protected actualizarCampoFormularioCrear(field: keyof CrearPlaylistDto, value: string | boolean): void {
    this.formularioCrearPlaylist.update(formulario => ({
      ...formulario,
      [field]: value
    }));
  }

  private reiniciarFormularioCrear(): void {
    this.formularioCrearPlaylist.set({
      titulo: '',
      descripcion: '',
      urlImagenPortada: '',
      esPublica: false,
      esColaborativa: false
    });
  }

  protected clearError(): void {
    this.error.set(null);
  }

  protected formatearDuracion(segundos: number): string {
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
      month: 'short',
      day: 'numeric'
    });
  }

  protected encodeURIComponent(text: string): string {
    return encodeURIComponent(text);
  }

  protected onTituloInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actualizarCampoFormularioCrear('titulo', input.value);
  }

  protected onDescripcionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.actualizarCampoFormularioCrear('descripcion', textarea.value);
  }

  protected onUrlImagenInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actualizarCampoFormularioCrear('urlImagenPortada', input.value);
  }

  protected onEsPublicaChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.actualizarCampoFormularioCrear('esPublica', checkbox.checked);
  }

  protected onEsColaborativaChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.actualizarCampoFormularioCrear('esColaborativa', checkbox.checked);
  }

  protected onTerminoBusquedaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusquedaPublica.set(input.value);
  }

  protected onBuscarPublicasSubmit(event: Event): void {
    event.preventDefault();
    this.buscarPlaylistsPublicas();
  }
}
