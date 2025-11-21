export interface Album {
  id: number;
  titulo: string;
}

export interface CrearAlbumDto {
  tituloAlbum: string;
  anioLanzamiento: number;
  genero: string;
  descripcion?: string;
  numeroPistas?: number;
  duracionTotalSegundos?: number;
}

export interface ActualizarAlbumDto {
  tituloAlbum?: string;
  anioLanzamiento?: number;
  genero?: string;
  descripcion?: string;
  numeroPistas?: number;
  duracionTotalSegundos?: number;
}

export interface AlbumDto {
  id: number;
  tituloAlbum: string;
  anioLanzamiento: number;
  genero: string;
  descripcion: string | null;
  numeroPistas: number;
  duracionTotalSegundos: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EstadisticasAlbumesDto {
  totalAlbumes: number;
  mensaje: string;
}

export interface EstadisticasAlbumesArtistaDto {
  artistaId: number;
  totalAlbumes: number;
}



