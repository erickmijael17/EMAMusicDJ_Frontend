export interface HistorialReproduccionDto {
    reproduccionId: number;
    usuarioId: number;
    videoId: string;
    titulo: string;
    canal: string;
    miniaturaUrl: string;
    duracionSegundos: number;
    duracionTexto: string;
    fechaReproduccion: string;
    duracionReproducidaSegundos: number | null;
    porcentajeCompletado: number | null;
    tipoDispositivo: string | null;
    pais: string | null;
    ciudad: string | null;
}

export interface HistorialPaginadoDto {
    contenido: HistorialReproduccionDto[];
    paginaActual: number;
    tamanioPagina: number;
    totalElementos: number;
    totalPaginas: number;
    esUltimaPagina: boolean;
    esPrimeraPagina: boolean;
}

export interface RegistrarReproduccionRequest {
    usuarioId: number;
    videoId: string;
    duracionReproducidaSegundos?: number;
    porcentajeCompletado?: number;
    tipoDispositivo?: string;
    direccionIp?: string;
    pais?: string;
    ciudad?: string;
}

export interface RespuestaHistorialOperacion {
    mensaje: string;
    estado: 'SUCCESS' | 'ERROR';
    historial?: HistorialReproduccionDto;
    reproduccionId?: number;
    usuarioId?: number;
}

export interface RespuestaHistorialReciente {
    estado: 'SUCCESS' | 'ERROR';
    total: number;
    historial: HistorialReproduccionDto[];
}

export interface RespuestaContadorHistorial {
    estado: 'SUCCESS' | 'ERROR';
    usuarioId: number;
    totalReproducciones: number;
}
