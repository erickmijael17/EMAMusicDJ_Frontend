import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ServicioMusica } from '../../../../domains/youtube/services/music.service';
import { CancionHibridaDto } from '../../../../domains/youtube/models/youtube-search.model';
import { ServicioReproduccion } from '../../../../domains/playback/services/playback.service';
import { APP_ICONS } from '../../../../shared/icons/app-icons';
import { PlaylistModalComponent } from '../../../../shared/components/playlist-modal/playlist-modal.component';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FaIconComponent, PlaylistModalComponent],
  templateUrl: './buscar.html',
  styleUrls: ['./buscar.scss']
})
export class Buscar implements OnInit, OnDestroy {

  private servicioMusica = inject(ServicioMusica);
  private servicioReproduccion = inject(ServicioReproduccion);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private sujetoBusqueda$ = new Subject<string>();

  protected consultaBusqueda = signal<string>('');
  protected pistas = signal<CancionHibridaDto[]>([]);
  protected estaCargando = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected haBuscado = signal<boolean>(false);

  protected mostrarModalPlaylist = signal<boolean>(false);
  protected pistaSeleccionada = signal<CancionHibridaDto | null>(null);

  protected readonly iconos = APP_ICONS;

  ngOnInit(): void {
    this.sujetoBusqueda$.pipe(
      debounceTime(1500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(consulta => {
      this.realizarBusqueda(consulta);
    });

    this.servicioMusica.resultadosBusqueda$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(resultados => {
      this.pistas.set(resultados);
    });

    this.servicioMusica.estaBuscando$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(estaBuscando => {
      this.estaCargando.set(estaBuscando);
    });

    this.servicioMusica.errorBusqueda$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.error.set(error);
    });

    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['q']) {
        const consulta = params['q'];
        this.consultaBusqueda.set(consulta);
        this.realizarBusqueda(consulta);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onInputBusqueda(event: Event): void {
    const consulta = (event.target as HTMLInputElement).value;
    this.consultaBusqueda.set(consulta);

    if (consulta.trim().length === 0) {
      this.limpiarBusqueda();
      return;
    }

    this.sujetoBusqueda$.next(consulta);
  }

  protected realizarBusqueda(consulta: string): void {
    if (!consulta || consulta.trim().length === 0) {
      return;
    }

    this.haBuscado.set(true);
    this.error.set(null);

    // Usar búsqueda híbrida que guarda en BD
    this.servicioMusica.buscarHibrido(consulta).subscribe({
      error: (err) => {
        // El estado de error ya se maneja en el servicio, aquí solo logueamos si es necesario.
        console.error('Error en el componente de búsqueda:', err);
      }
    });
  }

  protected limpiarBusqueda(): void {
    this.consultaBusqueda.set('');
    this.pistas.set([]);
    this.error.set(null);
    this.haBuscado.set(false);
    this.servicioMusica.limpiarResultadosBusqueda();
  }

  protected reproducirPista(cancion: CancionHibridaDto, indice?: number): void {
    const terminoBusqueda = this.consultaBusqueda();
    const pistas = this.pistas();
    const indiceCancion = indice !== undefined ? indice : pistas.findIndex(p => p.id_video === cancion.id_video);

    if (indiceCancion === -1) {
      console.warn('No se encontró el índice de la canción en los resultados');
      this.servicioReproduccion.reproducirCancionHibrida(cancion);
      return;
    }

    console.log('Reproduciendo desde búsqueda:', {
      cancion: cancion.titulo,
      terminoBusqueda,
      indice: indiceCancion,
      totalResultados: pistas.length
    });

    this.servicioReproduccion.reproducirDesdeBusqueda(
      cancion.id_video,
      terminoBusqueda,
      indiceCancion
    );
  }

  protected abrirModalPlaylist(cancion: CancionHibridaDto, event: Event): void {
    event.stopPropagation();
    this.pistaSeleccionada.set(cancion);
    this.mostrarModalPlaylist.set(true);
  }

  protected cerrarModalPlaylist(): void {
    this.mostrarModalPlaylist.set(false);
    this.pistaSeleccionada.set(null);
  }

  protected onCancionAgregada(event: { playlist: any; cancion: CancionHibridaDto }): void {
    console.log(`Canción "${event.cancion.titulo}" agregada a "${event.playlist.titulo}"`);
  }

  protected onErrorImagen(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Obtener nombres de todos los artistas concatenados
   */
  protected obtenerNombresArtistas(cancion: CancionHibridaDto): string {
    if (cancion.artistas && cancion.artistas.length > 0) {
      return cancion.artistas.map(a => a.nombre).join(', ');
    }
    return cancion.canal || 'Artista desconocido';
  }

  /**
   * Verificar si la canción tiene información de álbum
   */
  protected tieneAlbum(cancion: CancionHibridaDto): boolean {
    return !!(cancion.album && cancion.album.nombre);
  }
}
