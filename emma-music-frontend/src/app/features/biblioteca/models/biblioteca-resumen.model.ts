export interface EstadisticasBiblioteca {
  totalFavoritas: number;
  totalPlaylists: number;
  totalDuracion: number;
}

export interface DatosBiblioteca {
  favoritos: any[];
  playlists: any[];
  estadisticas: EstadisticasBiblioteca;
}

