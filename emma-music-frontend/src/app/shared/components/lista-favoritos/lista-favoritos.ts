import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ServicioFavoritos } from '../../../domains/favorites/services/favoritos.service';
import { ServicioAutenticacion } from '../../../domains/auth/services/auth.service';
import { FavoritoHibridoDto, TipoFavorito } from '../../../domains/favorites/models/favorito.model';

@Component({
  selector: 'app-lista-favoritos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-favoritos.html',
  styleUrls: ['./lista-favoritos.scss']
})
export class ListaFavoritos implements OnInit, OnDestroy {

  protected favoritos = signal<FavoritoHibridoDto[]>([]);
  protected totalFavoritos = signal<number>(0);
  protected totalPistas = signal<number>(0);
  protected totalMetadatos = signal<number>(0);

  protected cargando = signal<boolean>(false);
  protected filtroActual = signal<'todos' | 'pistas' | 'metadatos'>('todos');
  protected ordenActual = signal<'reciente' | 'titulo' | 'artista'>('reciente');

  protected favoritosFiltrados = computed(() => {
    let resultado = [...this.favoritos()];

    switch (this.filtroActual()) {
      case 'pistas':
        resultado = resultado.filter(f => f.tipoFavorito === TipoFavorito.PISTA_PRINCIPAL);
        break;
      case 'metadatos':
        resultado = resultado.filter(f => f.tipoFavorito === TipoFavorito.METADATO_YOUTUBE);
        break;
    }

    switch (this.ordenActual()) {
      case 'titulo':
        resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'artista':
        resultado.sort((a, b) => a.canal.localeCompare(b.canal));
        break;
      default:
        resultado.sort((a, b) =>
          new Date(b.fechaAdicion).getTime() - new Date(a.fechaAdicion).getTime()
        );
    }

    return resultado;
  });

  private usuarioId: number = 0;
  private subscripciones: Subscription[] = [];

  constructor(
    private servicioFavoritos: ServicioFavoritos,
    private servicioAutenticacion: ServicioAutenticacion
  ) {}

  ngOnInit(): void {
    const usuario = this.servicioAutenticacion.obtenerUsuarioActual();
    if (usuario) {
      this.usuarioId = usuario.usuarioId;
      this.cargarFavoritos();
    }
  }

  ngOnDestroy(): void {
    this.subscripciones.forEach(sub => sub.unsubscribe());
  }

  protected cargarFavoritos(): void {
    this.cargando.set(true);

    const sub = this.servicioFavoritos.obtenerFavoritosPorUsuario(this.usuarioId)
      .subscribe({
        next: respuesta => {
          this.favoritos.set(respuesta.favoritos);
          this.totalFavoritos.set(respuesta.total);
          this.totalPistas.set(respuesta.totalPistas);
          this.totalMetadatos.set(respuesta.totalMetadatos);
          this.cargando.set(false);
        },
        error: err => {
          console.error('Error cargando favoritos:', err);
          this.cargando.set(false);
        }
      });

    this.subscripciones.push(sub);
  }

  protected cambiarFiltro(filtro: 'todos' | 'pistas' | 'metadatos'): void {
    this.filtroActual.set(filtro);
  }

  protected cambiarOrden(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.ordenActual.set(select.value as 'reciente' | 'titulo' | 'artista');
  }

  protected eliminarFavorito(favorito: FavoritoHibridoDto): void {
    if (!confirm(`¿Eliminar "${favorito.titulo}" de favoritos?`)) {
      return;
    }

    const sub = this.servicioFavoritos.eliminarFavorito(
      this.usuarioId,
      favorito.idVideoYoutube
    ).subscribe({
      next: () => {
        this.cargarFavoritos();
      },
      error: err => console.error('Error eliminando favorito:', err)
    });

    this.subscripciones.push(sub);
  }

  protected reproducir(favorito: FavoritoHibridoDto): void {
    console.log('Reproducir:', favorito.idVideoYoutube);
  }

  protected formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

