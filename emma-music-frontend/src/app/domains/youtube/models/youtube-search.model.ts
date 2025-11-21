export enum TipoCancion {
  PRINCIPAL = 'PRINCIPAL',
  EN_CACHE = 'EN_CACHE',
  METADATOS = 'METADATOS',
  SOLO_YOUTUBE = 'SOLO_YOUTUBE'
}

/**
 * DTO completo para resultados de búsqueda de YouTube/Híbrido
 * Este DTO se usa en ambos endpoints:
 * - /api/youtube/buscar (búsqueda directa en YouTube Music)
 * - /api/v1/hibrido/buscar (búsqueda híbrida: BD local + YouTube)
 */
export interface CancionHibridaDto {
  // Campos principales
  id_video: string;
  titulo: string;
  categoria?: string; // "Canción", "Video", etc.
  tipo_resultado?: string; // "song", "video", "album"

  // Información de artistas
  canal?: string; // Canal de YouTube (fallback)
  artistas?: ArtistaDto[];

  // Información del álbum
  album?: AlbumDto;

  // Duración
  duracion: string; // Formato legible (mm:ss)
  duracion_segundos: number;

  // Multimedia
  miniaturas: string[]; // URLs en diferentes calidades

  // Metadatos adicionales
  vistas?: string; // Formato legible (ej: "1.2M views")
  es_explicito: boolean;

  // Tokens para feedback (puede ser null)
  tokens_feedback?: TokensFeedbackDto | null;

  // Campos adicionales del sistema híbrido
  contadorReproducciones?: number;
  tipoCancion?: TipoCancion;
  estaEnCache?: boolean;
  estaDescargada?: boolean;
  pistaId?: number;
}

/**
 * DTO para información de artistas
 */
export interface ArtistaDto {
  nombre: string;
  id_artista: string; // ID del artista en YouTube Music
}

/**
 * DTO para información de álbum
 */
export interface AlbumDto {
  nombre: string;
  id_album: string; // ID del álbum en YouTube Music
}

/**
 * DTO para tokens de feedback (add/remove)
 */
export interface TokensFeedbackDto {
  add?: string;
  remove?: string;
}

// Interfaz para la respuesta del endpoint híbrido (puede venir como array o como objeto wrapper)
export interface ResultadoBusquedaHibridaDto {
  canciones?: CancionHibridaDto[];
  totalResultados?: number;
  mensaje?: string;
}

export enum TipoReproduccion {
  ARCHIVO_LOCAL = 'ARCHIVO_LOCAL',
  STREAM_YOUTUBE = 'STREAM_YOUTUBE',
  CACHE_PRINCIPAL = 'CACHE_PRINCIPAL',
  YOUTUBE_DIRECTO = 'YOUTUBE_DIRECTO',
  ERROR = 'ERROR'
}

export interface ResultadoReproduccionHibridaDto {
  id_video?: string;
  videoId?: string;
  url_stream?: string;
  urlStream?: string;
  urlReproduccion?: string;
  titulo: string;
  descripcion?: string;
  duracion_segundos?: number;
  duracionSegundos?: number;
  miniatura?: string;
  miniaturaUrl?: string;
  canal?: string;
  id_canal?: string;
  uploader?: string;
  vistas?: number;
  likes?: number;
  fecha_subida?: string;
  extension?: string;
  codec_audio?: string;
  frecuencia_muestreo_hz?: number;
  bitrate_kbps?: number;
  calidad?: string;
  tipo_reproduccion?: TipoReproduccion | string;
  tipoReproduccion?: TipoReproduccion | string;
  esPrincipal?: boolean;
  estaEnCachePrincipal?: boolean;
  mensaje?: string;
}

export interface StreamYouTubeDto {
  idVideo: string;
  urlStream: string;
  titulo: string;
  duracionSegundos: number;
  miniatura: string;
  canal: string;
  vistas: number;
  bitrateKbps: number;
}



