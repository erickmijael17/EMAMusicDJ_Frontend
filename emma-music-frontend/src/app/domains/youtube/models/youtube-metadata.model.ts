export interface MetadatoYouTubeDto {
  id: number;
  videoId: string;
  titulo: string;
  canal: string;
  duracionSegundos: number;
  miniaturaUrl: string;
  esExplicito: boolean;
  contadorReproducciones: number;
  contadorPlaylists: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EstadisticasMetadatosDto {
  metadatosMigrados: number;
  candidatasParaMigracion: number;
  usadasEnPlaylists: number;
  mensaje: string;
}

export interface ResultadoMigracionAutomaticaDto {
  mensaje: string;
  candidatasIniciales: number;
  candidatasRestantes: number;
  migradas: number;
  estado: string;
}

export interface EstadisticasHibridasDto {
  candidatasParaMigracion: number;
  sistemaFuncionando: boolean;
  mensaje: string;
}



