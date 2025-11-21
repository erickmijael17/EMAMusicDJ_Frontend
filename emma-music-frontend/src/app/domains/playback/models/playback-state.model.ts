import { CancionHibridaDto } from '../../youtube/models/youtube-search.model';

export interface ResultadoBusquedaPista {
  idVideo: string;
  titulo: string;
  artistas: string[];
  album: string;
  duracion: string;
  miniatura: string;
}

export interface EstadoReproduccion {
  pistaActual: ResultadoBusquedaPista | null;
  estaReproduciendo: boolean;
  tiempoActual: number;
  duracion: number;
  volumen: number;
}

export interface ColaReproduccion {
  pistas: CancionHibridaDto[];
  indiceActual: number;
  aleatorio: boolean;
  repetir: 'no' | 'pista' | 'playlist';
}



