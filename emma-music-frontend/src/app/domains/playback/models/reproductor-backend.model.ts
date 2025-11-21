export enum TipoReproduccion {
    STREAM_ONLINE = 'STREAM_ONLINE',
    ARCHIVO_LOCAL = 'ARCHIVO_LOCAL',
    STREAM_YOUTUBE = 'STREAM_YOUTUBE',
    CACHE_PRINCIPAL = 'CACHE_PRINCIPAL',
    YOUTUBE_DIRECTO = 'YOUTUBE_DIRECTO'
}

export enum ModoReproduccion {
    NORMAL = 'NORMAL',
    ALEATORIO = 'ALEATORIO',
    REPETIR_TODAS = 'REPETIR_TODAS',
    REPETIR_UNA = 'REPETIR_UNA'
}

export enum TipoEventoWebSocket {
    REPRODUCIENDO = 'REPRODUCIENDO',
    PAUSADO = 'PAUSADO',
    SIGUIENTE = 'SIGUIENTE',
    ANTERIOR = 'ANTERIOR',
    STREAM_LISTO = 'STREAM_LISTO',
    ERROR = 'ERROR',
    ACTUALIZACION_COLA = 'ACTUALIZACION_COLA'
}

export interface EstadoReproductorDto {
    videoIdActual: string | null;
    tituloActual: string | null;
    canalActual: string | null;
    miniaturaUrl: string | null;
    duracionSegundos: number | null;
    estaReproduciendo: boolean;
    posicionSegundos: number;
    volumen: number;
    esFavorita: boolean;
    urlReproduccion: string | null;
    tipoReproduccion: TipoReproduccion | null;
    indiceEnCola: number;
    totalEnCola: number;
    tieneSiguiente: boolean;
    tieneAnterior: boolean;
    modoReproduccion: ModoReproduccion;
    estadoId?: number;
    usuarioId?: number;
    fechaActualizacion?: string;
}

export interface MensajeWebSocketDto {
    tipoEvento: TipoEventoWebSocket;
    estadoReproductor: EstadoReproductorDto | null;
    mensaje: string | null;
    timestamp: number;
}

export interface CancionColaDto {
    videoId: string;
    titulo: string;
    canal: string;
    duracionSegundos: number;
    duracionTexto: string;
    miniaturaUrl: string;
    esExplicita: boolean;
    tipoCancion: string;
}

export interface ColaReproduccionDto {
    usuarioId: number;
    canciones: CancionColaDto[];
    indiceActual: number;
    totalCanciones: number;
    modoReproduccion: ModoReproduccion;
    contextoOrigen?: string;
    terminoBusqueda?: string;
}

export interface AgregarAColaRequest {
    usuarioId: number;
    videoIds: string[];
    reproducirAhora: boolean;
}

export interface ReordenarColaRequest {
    usuarioId: number;
    indiceOrigen: number;
    indiceDestino: number;
}

export interface CambiarModoRequest {
    usuarioId: number;
    modo: ModoReproduccion;
}

export interface RespuestaToggleFavorito {
    mensaje: string;
    esFavorita: boolean;
    estado: EstadoReproductorDto;
}

export interface RespuestaColaOperacion {
    mensaje: string;
    cola: ColaReproduccionDto;
    estado: string;
}

export interface RespuestaLimpiarCola {
    mensaje: string;
    estado: string;
}

