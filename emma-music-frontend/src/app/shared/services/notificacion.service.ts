import { Injectable, signal } from '@angular/core';

export interface Notificacion {
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  titulo?: string;
  mensaje: string;
  duracion?: number;
  icono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicioNotificaciones {

  private notificacionActual = signal<Notificacion | null>(null);
  public notificacion = this.notificacionActual.asReadonly();

  private timeoutId: any = null;

  mostrar(notificacion: Notificacion): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    const duracion = notificacion.duracion || this.obtenerDuracionPorTipo(notificacion.tipo);
    const icono = notificacion.icono || this.obtenerIconoPorTipo(notificacion.tipo);

    this.notificacionActual.set({
      ...notificacion,
      icono,
      duracion
    });

    this.timeoutId = setTimeout(() => {
      this.ocultar();
    }, duracion);
  }

  ocultar(): void {
    this.notificacionActual.set(null);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  exito(mensaje: string, titulo?: string): void {
    this.mostrar({
      tipo: 'exito',
      mensaje,
      titulo: titulo || 'Éxito',
      duracion: 3000
    });
  }

  error(mensaje: string, titulo?: string): void {
    this.mostrar({
      tipo: 'error',
      mensaje,
      titulo: titulo || 'Error',
      duracion: 5000
    });
  }

  advertencia(mensaje: string, titulo?: string): void {
    this.mostrar({
      tipo: 'advertencia',
      mensaje,
      titulo: titulo || 'Advertencia',
      duracion: 4000
    });
  }

  info(mensaje: string, titulo?: string): void {
    this.mostrar({
      tipo: 'info',
      mensaje,
      titulo: titulo || 'Información',
      duracion: 3000
    });
  }

  private obtenerDuracionPorTipo(tipo: string): number {
    const duraciones: { [key: string]: number } = {
      'exito': 3000,
      'error': 5000,
      'advertencia': 4000,
      'info': 3000
    };
    return duraciones[tipo] || 3000;
  }

  private obtenerIconoPorTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'exito': '✓',
      'error': '✕',
      'advertencia': '⚠',
      'info': 'ℹ'
    };
    return iconos[tipo] || 'ℹ';
  }
}

