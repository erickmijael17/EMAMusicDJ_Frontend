import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Sidebar } from './layout/sidebar/sidebar';
import { PlayerControls } from './layout/player-controls/player-controls';
import { NotificacionesComponent } from './shared/components/notificaciones/notificaciones.component';
import { ServicioReproductorIntegrado } from './domains/playback/services/reproductor-integrado.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Sidebar, PlayerControls, NotificacionesComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private servicioReproductor = inject(ServicioReproductorIntegrado);

  protected readonly title = signal('emma-music-frontend');
  protected readonly tieneCancionActiva = signal(false);

  ngOnInit(): void {
    this.servicioReproductor.estadoReproductor$.subscribe(estado => {
      this.tieneCancionActiva.set(estado?.videoIdActual != null);
    });
  }
}
