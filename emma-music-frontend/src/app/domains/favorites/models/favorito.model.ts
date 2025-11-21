export enum TipoFavorito {
  PISTA_PRINCIPAL = 'PISTA_PRINCIPAL',
  METADATO_YOUTUBE = 'METADATO_YOUTUBE'
}

export interface FavoritoHibridoDto {
  usuarioId: number;
  idVideoYoutube: string;
  titulo: string;
  canal: string;
  duracionSegundos: number;
  duracionTexto: string;
  miniaturaUrl: string;
  esExplicito: boolean;
  tipoFavorito: TipoFavorito;
  pistaId: number | null;
  metadatoId: number | null;
  fechaAdicion: string;
  estaDescargada: boolean;
  migradaAPrincipal: boolean;
}

export interface RespuestaFavoritoHibrido {
  mensaje: string;
  favorito: FavoritoHibridoDto;
  estado: string;
}

export interface RespuestaListaFavoritosHibrida {
  favoritos: FavoritoHibridoDto[];
  total: number;
  totalPistas: number;
  totalMetadatos: number;
  usuarioId: number;
}

export interface VerificacionFavoritoDto {
  esFavorito: boolean;
  usuarioId: number;
  idVideoYoutube: string;
}

export interface ConteoFavoritosDto {
  totalFavoritos: number;
  totalPistas: number;
  totalMetadatos: number;
  usuarioId: number;
}

export interface AgregarFavoritoRequest {
  usuarioId: number;
  idVideoYoutube: string;
}

export interface RespuestaEliminacionFavorito {
  mensaje: string;
  usuarioId: string;
  idVideoYoutube: string;
  estado: string;
}



