import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { APP_ICONS } from '../../icons/app-icons';

@Component({
  selector: 'app-music-card',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  templateUrl: './music-card.component.html',
  styleUrls: ['./music-card.component.scss']
})
export class MusicCardComponent {
  @Input() titulo: string = '';
  @Input() subtitulo: string = '';
  @Input() imagenUrl: string = '';
  @Input() duracion: string = '';
  @Input() mostrarBotonPlay: boolean = true;
  @Input() mostrarBotonOpciones: boolean = true;
  @Input() isPlaying: boolean = false;

  @Output() reproducir = new EventEmitter<void>();
  @Output() opciones = new EventEmitter<void>();
  @Output() click = new EventEmitter<void>();

  protected readonly iconos = APP_ICONS;

  protected onReproducir(event: Event): void {
    event.stopPropagation();
    this.reproducir.emit();
  }

  protected onOpciones(event: Event): void {
    event.stopPropagation();
    this.opciones.emit();
  }

  protected onClick(): void {
    this.click.emit();
  }

  protected onErrorImagen(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

