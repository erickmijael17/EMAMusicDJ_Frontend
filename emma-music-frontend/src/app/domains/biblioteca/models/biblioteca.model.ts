export interface CancionBibliotecaDto {
    metadatoId: number;
    videoId: string;
    titulo: string;
    canal: string;
    duracionSegundos: number;
    duracionTexto: string;
    miniaturaUrl: string;
    esExplicita: boolean;
    contadorReproducciones: number;
    fechaAdicion: string;
    esFavorita: boolean;
    vecesReproducida: number;
}

export interface BibliotecaDto {
    usuarioId: number;
    favoritos: CancionBibliotecaDto[];
    recientementeReproducidas: CancionBibliotecaDto[];
    estadisticas: EstadisticasBibliotecaDto;
    totalCanciones: number;
}

export interface BibliotecaPaginadaDto {
    canciones: CancionBibliotecaDto[];
    paginaActual: number;
    tamanoPagina: number;
    totalPaginas: number;
    totalElementos: number;
    esUltimaPagina: boolean;
    esPrimeraPagina: boolean;
}

export interface EstadisticasBibliotecaDto {
    totalFavoritos: number;
    totalReproducciones: number;
    totalPlaylists: number;
    totalCancionesUnicas: number;
    cancionMasReproducida: string;
    artistaFavorito: string;
    minutosEscuchados: number;
}
