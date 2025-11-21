import { Component, input, output, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { ServicioPlaylist } from '../../../domains/playlists/services/playlist.service';
import { ServicioMusica } from '../../../domains/youtube/services/music.service';
import { ServicioAutenticacion } from '../../../domains/auth/services/auth.service';
import { ServicioNotificaciones } from '../../services/notificacion.service';
import { CancionHibridaDto } from '../../../domains/youtube/models/youtube-search.model';
import { PlaylistDto, CrearPlaylistDto } from '../../../domains/playlists/models/playlist.model';
import { APP_ICONS } from '../../icons/app-icons';

@Component({
  selector: 'app-playlist-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FaIconComponent],
  templateUrl: './playlist-modal.component.html',
  styleUrls: ['./playlist-modal.component.scss']
})
export class PlaylistModalComponent implements OnInit, OnDestroy {
  private servicioPlaylist = inject(ServicioPlaylist);
  private servicioMusica = inject(ServicioMusica);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private servicioNotificaciones = inject(ServicioNotificaciones);

  protected readonly iconos = APP_ICONS;

  pistaSeleccionada = input.required<CancionHibridaDto>();
  mostrar = input<boolean>(false);

  cerrar = output<void>();
  cancionAgregada = output<{ playlist: PlaylistDto; cancion: CancionHibridaDto }>();

  protected todasLasPlaylists = signal<PlaylistDto[]>([]);
  protected terminoBusqueda = signal<string>('');
  protected estaCargando = signal<boolean>(false);
  protected mostrarFormCrear = signal<boolean>(false);
  protected playlistsEnProceso = signal<Set<number>>(new Set());
  protected playlistsConExito = signal<Set<number>>(new Set());
  protected playlistsConCancion = signal<Set<number>>(new Set());

  protected tituloNuevaPlaylist = signal<string>('');
  protected creandoPlaylist = signal<boolean>(false);
  protected mostrarDetalles = signal<number | null>(null);

  protected playlistsFiltradas = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();
    const playlists = this.todasLasPlaylists();

    if (!termino) {
      return playlists;
    }

    return playlists.filter(p =>
      p.titulo.toLowerCase().includes(termino) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(termino))
    );
  });

  constructor() {
    effect(() => {
      if (this.mostrar()) {
        this.cargarPlaylists();
        document.addEventListener('keydown', this.handleKeyDown);
      } else {
        document.removeEventListener('keydown', this.handleKeyDown);
        this.limpiarEstado();
      }
    });
  }

  ngOnInit(): void {
    this.cargarPlaylists();
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.onCerrar();
    }
  };

  private limpiarEstado(): void {
    this.terminoBusqueda.set('');
    this.mostrarFormCrear.set(false);
    this.tituloNuevaPlaylist.set('');
    this.playlistsEnProceso.set(new Set());
    this.playlistsConExito.set(new Set());
  }

  private cargarPlaylists(): void {
    this.estaCargando.set(true);
    this.servicioPlaylist.obtenerMisPlaylists().subscribe({
      next: (playlists) => {
        this.todasLasPlaylists.set(playlists);
        this.verificarCancionEnPlaylists(playlists);
        this.estaCargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando playlists:', error);
        this.servicioNotificaciones.error('Error al cargar las playlists');
        this.estaCargando.set(false);
      }
    });
  }

  private verificarCancionEnPlaylists(playlists: PlaylistDto[]): void {
    const cancion = this.pistaSeleccionada();
    if (!cancion) return;

    playlists.forEach(playlist => {
      this.servicioPlaylist.obtenerCancionesPlaylist(playlist.listaId).subscribe({
        next: (canciones) => {
          const tieneCancion = canciones.some(c => c.idVideoYoutube === cancion.id_video);
          if (tieneCancion) {
            const conCancion = new Set(this.playlistsConCancion());
            conCancion.add(playlist.listaId);
            this.playlistsConCancion.set(conCancion);
          }
        },
        error: () => {
          // Ignorar errores silenciosamente
        }
      });
    });
  }

  protected onCerrar(): void {
    this.cerrar.emit();
  }

  protected onAgregarAPlaylist(playlist: PlaylistDto, event: Event): void {
    event.stopPropagation();

    const cancion = this.pistaSeleccionada();
    if (!cancion) return;

    if (this.playlistsEnProceso().has(playlist.listaId)) {
      return;
    }

    if (this.playlistsConCancion().has(playlist.listaId)) {
      this.servicioNotificaciones.advertencia(`Ya está en "${playlist.titulo}"`);
      return;
    }

    const enProceso = new Set(this.playlistsEnProceso());
    enProceso.add(playlist.listaId);
    this.playlistsEnProceso.set(enProceso);

    const usuarioId = this.servicioAutenticacion.obtenerUsuarioActual()?.usuarioId;

    this.servicioMusica.agregarCancionAPlaylist(playlist.listaId, cancion.id_video, usuarioId).subscribe({
      next: () => {
        const enProceso = new Set(this.playlistsEnProceso());
        enProceso.delete(playlist.listaId);
        this.playlistsEnProceso.set(enProceso);

        const conExito = new Set(this.playlistsConExito());
        conExito.add(playlist.listaId);
        this.playlistsConExito.set(conExito);

        const conCancion = new Set(this.playlistsConCancion());
        conCancion.add(playlist.listaId);
        this.playlistsConCancion.set(conCancion);

        this.servicioNotificaciones.exito(`✓ Agregado a "${playlist.titulo}"`);
        this.cancionAgregada.emit({ playlist, cancion });

        setTimeout(() => {
          const conExito = new Set(this.playlistsConExito());
          conExito.delete(playlist.listaId);
          this.playlistsConExito.set(conExito);
        }, 2000);
      },
      error: (error) => {
        const enProceso = new Set(this.playlistsEnProceso());
        enProceso.delete(playlist.listaId);
        this.playlistsEnProceso.set(enProceso);

        console.error('Error agregando canción a playlist:', error);

        if (error.message?.includes('ya existe')) {
          const conCancion = new Set(this.playlistsConCancion());
          conCancion.add(playlist.listaId);
          this.playlistsConCancion.set(conCancion);
          this.servicioNotificaciones.advertencia(`Ya está en "${playlist.titulo}"`);
        } else {
          this.servicioNotificaciones.error(
            error.message || `Error al agregar a "${playlist.titulo}"`
          );
        }
      }
    });
  }

  protected toggleFormCrear(): void {
    this.mostrarFormCrear.update(v => !v);
    if (!this.mostrarFormCrear()) {
      this.tituloNuevaPlaylist.set('');
    }
  }

  protected onCrearPlaylist(event: Event): void {
    event.preventDefault();

    const titulo = this.tituloNuevaPlaylist().trim();
    if (!titulo) {
      this.servicioNotificaciones.advertencia('El título es obligatorio');
      return;
    }

    this.creandoPlaylist.set(true);

    const nuevaPlaylist: CrearPlaylistDto = {
      titulo,
      descripcion: '',
      esPublica: false,
      esColaborativa: false
    };

    this.servicioPlaylist.crearPlaylist(nuevaPlaylist).subscribe({
      next: (playlistCreada) => {
        this.creandoPlaylist.set(false);
        this.servicioNotificaciones.exito(`Playlist "${titulo}" creada`);

        this.cargarPlaylists();
        this.tituloNuevaPlaylist.set('');
        this.mostrarFormCrear.set(false);

        setTimeout(() => {
          this.onAgregarAPlaylist(playlistCreada, new Event('click'));
        }, 300);
      },
      error: (error) => {
        this.creandoPlaylist.set(false);
        console.error('Error creando playlist:', error);
        this.servicioNotificaciones.error('Error al crear la playlist');
      }
    });
  }

  protected estaEnProceso(playlistId: number): boolean {
    return this.playlistsEnProceso().has(playlistId);
  }

  protected tieneExito(playlistId: number): boolean {
    return this.playlistsConExito().has(playlistId);
  }

  protected yaAgregada(playlistId: number): boolean {
    return this.playlistsConCancion().has(playlistId);
  }

  protected toggleDetalles(playlistId: number, event: Event): void {
    event.stopPropagation();
    const actual = this.mostrarDetalles();
    this.mostrarDetalles.set(actual === playlistId ? null : playlistId);
  }

  protected onOverlayClick(): void {
    this.onCerrar();
  }

  protected onModalClick(event: Event): void {
    event.stopPropagation();
  }

  protected onBusquedaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
  }

  protected limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
  }

  protected onTituloInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tituloNuevaPlaylist.set(input.value);
  }

  protected formatearDuracion(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    if (minutos > 0) {
      return `${minutos}m`;
    }
    return '< 1m';
  }
}

