export interface CrearReproduccionDto {
  usuarioId: number;
  pistaId?: number;
  idVideoYoutube: string;
  duracionReproducidaSegundos: number;
  porcentajeCompletado: number;
  tipoDispositivo?: string;
  direccionIp?: string;
  pais?: string;
  ciudad?: string;
}

export interface ReproduccionDto {
  id: number;
  usuarioId: number;
  pistaId: number | null;
  idVideoYoutube: string;
  duracionReproducidaSegundos: number;
  porcentajeCompletado: number;
  tipoDispositivo: string | null;
  direccionIp: string | null;
  pais: string | null;
  ciudad: string | null;
  fechaReproduccion: string;
}

export interface EstadisticasReproduccionesUsuarioDto {
  usuarioId: number;
  totalReproducciones: number;
  pistasUnicas?: number;
  tiempoTotalReproducido?: number;
  mensaje?: string;
}

export interface PistaPopularDto {
  pistaId: number;
  totalReproducciones: number;
}



