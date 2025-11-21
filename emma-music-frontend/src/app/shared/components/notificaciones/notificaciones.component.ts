import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioNotificaciones } from '../../services/notificacion.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.scss']
})
export class NotificacionesComponent {
  private servicioNotificaciones = inject(ServicioNotificaciones);

  protected notificacion = this.servicioNotificaciones.notificacion;

  protected cerrar(): void {
    this.servicioNotificaciones.ocultar();
  }
}

