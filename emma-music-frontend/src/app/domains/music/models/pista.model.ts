export interface CrearPistaDto {
  titulo: string;
  duracionSegundos: number;
  contenidoExplicito: boolean;
  idVideoYoutube: string;
}

export interface ActualizarPistaDto {
  titulo?: string;
  duracionSegundos?: number;
  contenidoExplicito?: boolean;
}

export interface PistaDto {
  id: number;
  titulo: string;
  duracionSegundos: number;
  contenidoExplicito: boolean;
  idVideoYoutube: string | null;
  rutaArchivoLocal: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EstadisticasArchivosDto {
  totalPistas: number;
  pistasConArchivo: number;
  pistasSinArchivo: number;
  porcentajeConArchivo: number;
}



