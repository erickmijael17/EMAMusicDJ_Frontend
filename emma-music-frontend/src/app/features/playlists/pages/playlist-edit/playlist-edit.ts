import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil, switchMap } from 'rxjs';

import { ServicioPlaylist } from '../../../../domains/playlists/services/playlist.service';
import { ServicioAutenticacion } from '../../../../domains/auth/services/auth.service';
import {
  PlaylistDto,
  ActualizarPlaylistDto
} from '../../../../domains/playlists/models/playlist.model';
import { APP_ICONS } from '../../../../shared/icons/app-icons';

@Component({
  selector: 'app-playlist-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FaIconComponent],
  templateUrl: './playlist-edit.html',
  styleUrls: ['./playlist-edit.scss']
})
export class PlaylistEdit implements OnInit, OnDestroy {

  private servicioPlaylist = inject(ServicioPlaylist);
  private servicioAuth = inject(ServicioAutenticacion);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  protected readonly iconos = APP_ICONS;

  protected playlist = signal<PlaylistDto | null>(null);
  protected estaCargando = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected estaGuardando = signal<boolean>(false);
  protected esPropietario = signal<boolean>(false);

  protected formularioEdicion = signal<ActualizarPlaylistDto>({
    titulo: '',
    descripcion: '',
    urlImagenPortada: '',
    esPublica: false,
    esColaborativa: false
  });

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
        },
        error: (error) => {
          console.error('Error cargando playlist:', error);
          this.error.set('No se pudo cargar la playlist');
        }
      });
  }

  private verificarPropietario(playlist: PlaylistDto): void {
    const usuario = this.servicioAuth.obtenerUsuarioActual();
    const esProp = usuario?.usuarioId === playlist.usuarioId;
    this.esPropietario.set(esProp);

    if (!esProp) {
      this.error.set('No tienes permisos para editar esta playlist');
      setTimeout(() => {
        this.router.navigate(['/playlists', playlist.listaId]);
      }, 2000);
    }
  }

  private setupSubscriptions(): void {
    this.servicioPlaylist.playlistActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playlist => {
        if (playlist) {
          this.playlist.set(playlist);
          this.formularioEdicion.set({
            titulo: playlist.titulo,
            descripcion: playlist.descripcion || '',
            urlImagenPortada: playlist.urlImagenPortada || '',
            esPublica: playlist.esPublica,
            esColaborativa: playlist.esColaborativa
          });
          this.verificarPropietario(playlist);
        }
      });

    this.servicioPlaylist.estaCargando$
      .pipe(takeUntil(this.destroy$))
      .subscribe(estaCargando => this.estaCargando.set(estaCargando));

    this.servicioPlaylist.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error.set(error));
  }

  protected actualizarCampoFormulario(field: keyof ActualizarPlaylistDto, value: string | boolean): void {
    this.formularioEdicion.update(formulario => ({
      ...formulario,
      [field]: value
    }));
  }

  protected guardarPlaylist(): void {
    const playlist = this.playlist();
    const formulario = this.formularioEdicion();

    if (!playlist || !this.esPropietario()) return;

    if (!formulario.titulo?.trim()) {
      this.error.set('El título de la playlist es obligatorio');
      return;
    }

    this.estaGuardando.set(true);

    this.servicioPlaylist.actualizarPlaylist(playlist.listaId, formulario).subscribe({
      next: () => {
        this.estaGuardando.set(false);
        this.router.navigate(['/playlists', playlist.listaId]);
      },
      error: (error) => {
        this.estaGuardando.set(false);
        console.error('Error actualizando playlist:', error);
      }
    });
  }

  protected cambiarVisibilidadRapida(): void {
    const playlist = this.playlist();
    if (!playlist || !this.esPropietario()) return;

    const nuevaVisibilidad = !playlist.esPublica;

    this.servicioPlaylist.cambiarVisibilidad(playlist.listaId, nuevaVisibilidad).subscribe({
      next: () => {
        this.actualizarCampoFormulario('esPublica', nuevaVisibilidad);
        console.log('Visibilidad actualizada');
      },
      error: (error) => console.error('Error cambiando visibilidad:', error)
    });
  }

  protected cambiarModoColaborativoRapido(): void {
    const playlist = this.playlist();
    if (!playlist || !this.esPropietario()) return;

    const nuevoModo = !playlist.esColaborativa;

    this.servicioPlaylist.cambiarModoColaborativo(playlist.listaId, nuevoModo).subscribe({
      next: () => {
        this.actualizarCampoFormulario('esColaborativa', nuevoModo);
        console.log('Modo colaborativo actualizado');
      },
      error: (error) => console.error('Error cambiando modo colaborativo:', error)
    });
  }

  protected cancelarEdicion(): void {
    const playlist = this.playlist();
    if (playlist) {
      this.router.navigate(['/playlists', playlist.listaId]);
    } else {
      this.router.navigate(['/playlists']);
    }
  }

  protected clearError(): void {
    this.error.set(null);
  }

  protected formatearFechaCreacion(fechaString: string): string {
    return new Date(fechaString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  protected onInputTitulo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actualizarCampoFormulario('titulo', input.value);
  }

  protected onInputDescripcion(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.actualizarCampoFormulario('descripcion', textarea.value);
  }

  protected onInputUrlImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.actualizarCampoFormulario('urlImagenPortada', input.value);
  }

  protected onChangeEsPublica(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.actualizarCampoFormulario('esPublica', checkbox.checked);
  }

  protected onChangeEsColaborativa(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.actualizarCampoFormulario('esColaborativa', checkbox.checked);
  }
}
