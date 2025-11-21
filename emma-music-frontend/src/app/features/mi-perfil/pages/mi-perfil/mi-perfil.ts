import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil } from 'rxjs';

import { ServicioAutenticacion, DtoRespuestaUsuario } from '../../../../domains/auth/services/auth.service';
import { ServicioFavoritos } from '../../../../domains/favorites/services/favoritos.service';
import { ServicioPlaylist } from '../../../../domains/playlists/services/playlist.service';
import { APP_ICONS } from '../../../../shared/icons/app-icons';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.scss']
})
export class MiPerfil implements OnInit, OnDestroy {

  private servicioAutenticacion = inject(ServicioAutenticacion);
  private servicioFavoritos = inject(ServicioFavoritos);
  private servicioPlaylist = inject(ServicioPlaylist);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  protected readonly iconos = APP_ICONS;

  protected usuario = signal<DtoRespuestaUsuario | null>(null);
  protected estaCargando = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected mostrarFormularioEdicion = signal<boolean>(false);

  protected estadisticas = signal({
    totalFavoritas: 0,
    totalPlaylists: 0
  });

  protected formularioEdicion = signal<{
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    email: string;
  }>({
    nombre: '',
    apellido: '',
    nombreUsuario: '',
    email: ''
  });

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarEstadisticas();
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
          this.inicializarFormulario(usuario);
        }
      });
  }

  private cargarUsuario(): void {
    const usuario = this.servicioAutenticacion.obtenerUsuarioActual();
    this.usuario.set(usuario);
    if (usuario) {
      this.inicializarFormulario(usuario);
    }
  }

  private inicializarFormulario(usuario: DtoRespuestaUsuario): void {
    this.formularioEdicion.set({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      nombreUsuario: usuario.nombreUsuario,
      email: usuario.email
    });
  }

  private cargarEstadisticas(): void {
    const usuario = this.usuario();
    if (!usuario) return;

    this.servicioFavoritos.contarFavoritos(usuario.usuarioId).subscribe({
      next: (conteo) => {
        this.estadisticas.update(stats => ({
          ...stats,
          totalFavoritas: conteo.totalFavoritos
        }));
      },
      error: (err) => console.error('Error cargando estadísticas de favoritos:', err)
    });

    this.servicioPlaylist.obtenerMisPlaylists().subscribe({
      next: (playlists) => {
        this.estadisticas.update(stats => ({
          ...stats,
          totalPlaylists: playlists.length
        }));
      },
      error: (err) => console.error('Error cargando estadísticas de playlists:', err)
    });
  }

  protected alternarFormularioEdicion(): void {
    this.mostrarFormularioEdicion.update(mostrar => !mostrar);
    if (!this.mostrarFormularioEdicion()) {
      const usuario = this.usuario();
      if (usuario) {
        this.inicializarFormulario(usuario);
      }
    }
  }

  protected guardarCambios(): void {
    const formulario = this.formularioEdicion();
    const usuario = this.usuario();

    if (!usuario) {
      this.error.set('No se pudo obtener la información del usuario');
      return;
    }

    if (!formulario.nombreUsuario.trim() || !formulario.email.trim()) {
      this.error.set('El nombre de usuario y el email son obligatorios');
      return;
    }

    this.estaCargando.set(true);
    this.error.set(null);

    this.servicioAutenticacion.actualizarPerfil(usuario.usuarioId, {
      nombre: formulario.nombre.trim() || undefined,
      apellido: formulario.apellido.trim() || undefined,
      nombreUsuario: formulario.nombreUsuario.trim(),
      email: formulario.email.trim()
    }).subscribe({
      next: () => {
        this.estaCargando.set(false);
        this.mostrarFormularioEdicion.set(false);
        console.log('Perfil actualizado exitosamente');
      },
      error: (err) => {
        this.estaCargando.set(false);
        this.error.set(err.message || 'Error al actualizar el perfil');
        console.error('Error actualizando perfil:', err);
      }
    });
  }

  protected cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.servicioAutenticacion.cerrarSesion();
    }
  }

  protected actualizarCampo(campo: 'nombre' | 'apellido' | 'nombreUsuario' | 'email', valor: string): void {
    this.formularioEdicion.update(form => ({
      ...form,
      [campo]: valor
    }));
  }

  protected onErrorImagen(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  protected limpiarError(): void {
    this.error.set(null);
  }

  protected obtenerIniciales(): string {
    const usuario = this.usuario();
    if (!usuario) return 'U';

    const nombre = usuario.nombre || '';
    const apellido = usuario.apellido || '';
    const nombreUsuario = usuario.nombreUsuario || '';

    if (nombre && apellido) {
      return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    }
    if (nombre) {
      return nombre.charAt(0).toUpperCase();
    }
    return nombreUsuario.charAt(0).toUpperCase();
  }
}

