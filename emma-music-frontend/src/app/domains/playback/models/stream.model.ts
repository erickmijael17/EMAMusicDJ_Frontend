export interface RespuestaStream {
  exito: boolean;
  urlStream?: string;
  titulo?: string;
  duracion?: number;
  miniatura?: string;
  error?: string;
}

export interface InformacionStream {
  titulo: string;
  duracion: number;
  miniatura: string;
  urlStream: string;
}

export interface InformacionStreamPistaPlaylist {
  urlStream: string;
  titulo: string;
  duracion: number;
  miniatura: string;
}

export interface RespuestaStreamPlaylist {
  pistas: InformacionStreamPistaPlaylist[];
  totalPistas: number;
  posicionActual: number;
}

export enum TipoReproduccion {
  ARCHIVO_LOCAL = 'ARCHIVO_LOCAL',
  STREAM_YOUTUBE = 'STREAM_YOUTUBE',
  ERROR = 'ERROR'
}



