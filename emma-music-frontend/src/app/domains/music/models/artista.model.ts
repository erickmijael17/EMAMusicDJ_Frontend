export interface Artista {
  id: number;
  nombreArtista: string;
}

export interface CrearArtistaDto {
  nombreArtista: string;
  biografia?: string;
  genero?: string;
  pais?: string;
  urlImagen?: string;
}

export interface ActualizarArtistaDto {
  nombreArtista?: string;
  biografia?: string;
  genero?: string;
  pais?: string;
  urlImagen?: string;
}

export interface ArtistaDto {
  id: number;
  nombreArtista: string;
  biografia: string | null;
  genero: string | null;
  pais: string | null;
  urlImagen: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EstadisticasArtistasDto {
  totalArtistas: number;
  mensaje: string;
}



