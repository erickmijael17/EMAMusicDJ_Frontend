export enum TipoPista {
  PRINCIPAL = 'PRINCIPAL',
  TEMPORAL = 'TEMPORAL',
  YOUTUBE = 'YOUTUBE'
}

export interface ArtistaCancion {
  nombre: string;
  id_artista: string;
}

export interface CancionPlaylistDto {
  metadatoId: number;
  idVideoYoutube: string;
  titulo: string;
  canal: string;
  duracionSegundos: number;
  duracionTexto: string;
  miniaturaUrl: string;
  esExplicito: boolean;
  posicion: number | null;
  fechaAdicion: string | null;
  anadidoPor: string | null;
}

export interface CancionPlaylistDtoLegacy {
  identificadorUnico: string;
  pistaId: number | null;
  pistaTemporalId: number | null;
  idVideoYoutube: string;
  titulo: string;
  canal: string;
  duracionSegundos: number;
  duracionTexto: string;
  miniaturaUrl: string | null;
  esExplicito: boolean;
  posicionEnPlaylist: number;
  fechaAdicion: string | null;
  tipoPista: TipoPista;
  estaDisponible: boolean;
  urlReproduccion: string | null;
}

export interface PlaylistDto {
  listaId: number;
  usuarioId: number;
  nombreUsuario?: string;
  titulo: string;
  descripcion: string | null;
  urlImagenPortada: string | null;
  esPublica: boolean;
  esColaborativa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  totalCanciones: number;
  canciones?: CancionPlaylistDto[];
}

export interface CrearPlaylistDto {
  titulo: string;
  descripcion?: string;
  urlImagenPortada?: string;
  esPublica?: boolean;
  esColaborativa?: boolean;
}

export interface ActualizarPlaylistDto {
  titulo?: string;
  descripcion?: string;
  urlImagenPortada?: string;
  esPublica?: boolean;
  esColaborativa?: boolean;
}

export interface RespuestaOperacionPlaylist {
  mensaje: string;
  listaId?: number;
  identificadorCancion?: string;
  esPublica?: boolean;
  esColaborativa?: boolean;
  estado: string;
}

export interface ContadorPlaylistDto {
  usuarioId: number;
  totalListas: number;
}

export interface PropietarioPlaylist {
  usuarioId: number;
  nombreUsuario: string;
  email: string;
}

export interface Album {
  id: number;
  titulo: string;
}

export interface Artista {
  id: number;
  nombreArtista: string;
}

export interface PistaPlaylist {
  id: number;
  titulo: string;
  duracionSegundos: number;
  idVideoYoutube: string | null;
  album: Album | null;
  artistas: Artista[] | null;
}

export interface Playlist {
  id: number;
  titulo: string;
  descripcion: string;
  esPublica: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  propietario: PropietarioPlaylist;
  pistas: PistaPlaylist[];
}


export interface AgregarPistaAPlaylistDto {
  idVideo: string;
  titulo?: string;
  artista?: string;
}



