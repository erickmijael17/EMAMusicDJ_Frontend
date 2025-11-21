import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { APP_ICONS } from '../../shared/icons/app-icons';
import { ServicioAutenticacion } from '../../domains/auth/services/auth.service';
import { ServicioPlaylist } from '../../domains/playlists/services/playlist.service';
import { PlaylistDto } from '../../domains/playlists/models/playlist.model';
import { CommonModule } from '@angular/common';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  protected readonly iconos = APP_ICONS;
  private servicioAuth = inject(ServicioAutenticacion);
  private servicioPlaylist = inject(ServicioPlaylist);
  private router = inject(Router);

  protected estaColapsado = signal<boolean>(false);
  protected playlistsRecientes = signal<PlaylistDto[]>([]);
  protected rutaActiva = signal<string>('');
  protected mostrarTodasPlaylists = signal<boolean>(false);

  protected playlistsVisibles = computed(() => {
    const playlists = this.playlistsRecientes();
    return this.mostrarTodasPlaylists() ? playlists : playlists.slice(0, 5);
  });

  protected hayMasPlaylists = computed(() => {
    return this.playlistsRecientes().length > 5;
  });

  ngOnInit(): void {
    this.cargarPlaylistsRecientes();
    this.monitorearRuta();
  }

  private cargarPlaylistsRecientes(): void {
    this.servicioPlaylist.obtenerMisPlaylists()
      .pipe(take(1))
      .subscribe({
        next: (playlists) => {
          this.playlistsRecientes.set(playlists);
        },
        error: (error) => {
          console.error('Error cargando playlists:', error);
        }
      });
  }

  private monitorearRuta(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.rutaActiva.set(event.url);
    });
  }

  protected toggleSidebar(): void {
    this.estaColapsado.update(valor => !valor);
  }

  protected toggleMostrarPlaylists(): void {
    this.mostrarTodasPlaylists.update(valor => !valor);
  }

  protected navegarAInicio(): void {
    this.router.navigate(['/inicio']);
  }

  protected crearNuevaPlaylist(): void {
    this.router.navigate(['/playlists']);
  }
}
