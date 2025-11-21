import { Component, inject, signal, computed, effect } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { APP_ICONS } from '../../shared/icons/app-icons';
import { ServicioAutenticacion, DtoRespuestaUsuario } from '../../domains/auth/services/auth.service';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    RouterLink,
    AsyncPipe,
    FormsModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly iconos = APP_ICONS;
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private router = inject(Router);

  public estaAutenticado$: Observable<boolean> = this.servicioAutenticacion.estaAutenticado$;
  public usuarioActual$: Observable<DtoRespuestaUsuario | null> = this.servicioAutenticacion.usuarioActual$;

  protected consultaBusqueda = signal<string>('');
  protected mostrarMenuUsuario = signal<boolean>(false);
  protected rutaActual = signal<string>('');
  protected esBusquedaActiva = computed(() => this.consultaBusqueda().trim().length > 0);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.rutaActual.set(event.url);
    });

    effect(() => {
      const ruta = this.rutaActual();
      if (!ruta.includes('/buscar')) {
        this.consultaBusqueda.set('');
      }
    });
  }

  protected onInputBusqueda(event: Event): void {
    const consulta = (event.target as HTMLInputElement).value;
    this.consultaBusqueda.set(consulta);
  }

  protected onFocusBusqueda(): void {
    if (!this.rutaActual().includes('/buscar')) {
      this.router.navigate(['/buscar']);
    }
  }

  protected realizarBusqueda(): void {
    const consulta = this.consultaBusqueda().trim();
    if (consulta.length > 0) {
      this.router.navigate(['/buscar'], {
        queryParams: { q: consulta }
      });
    }
  }

  protected onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.realizarBusqueda();
    }
  }

  protected limpiarBusqueda(): void {
    this.consultaBusqueda.set('');
    const inputBusqueda = document.querySelector('.search-bar input') as HTMLInputElement;
    if (inputBusqueda) {
      inputBusqueda.focus();
    }
  }

  protected toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.update(valor => !valor);
  }

  protected cerrarMenuUsuario(): void {
    this.mostrarMenuUsuario.set(false);
  }

  protected navegarAPerfil(): void {
    this.router.navigate(['/mi-perfil']);
    this.cerrarMenuUsuario();
  }

  protected navegarABiblioteca(): void {
    this.router.navigate(['/biblioteca']);
    this.cerrarMenuUsuario();
  }

  protected navegarAPlaylists(): void {
    this.router.navigate(['/playlists']);
    this.cerrarMenuUsuario();
  }

  protected cerrarSesion(): void {
    this.servicioAutenticacion.cerrarSesion();
    this.cerrarMenuUsuario();
    this.router.navigate(['/auth/login']);
  }

  protected obtenerAvatarPorDefecto(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23282828\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23fff\' font-size=\'20\' font-weight=\'600\'%3EU%3C/text%3E%3C/svg%3E';
  }

  protected obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].charAt(0).toUpperCase();
    }
    return palabras[0].charAt(0).toUpperCase() + palabras[palabras.length - 1].charAt(0).toUpperCase();
  }
}
