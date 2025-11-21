export const BIBLIOTECA_END_POINTS = {
    obtenerCompleta: (usuarioId: number) => `/api/v1/biblioteca/usuario/${usuarioId}`,
    obtenerCanciones: (usuarioId: number) => `/api/v1/biblioteca/usuario/${usuarioId}/canciones`,
    obtenerFavoritos: (usuarioId: number) => `/api/v1/biblioteca/usuario/${usuarioId}/favoritos`,
    obtenerRecientes: (usuarioId: number) => `/api/v1/biblioteca/usuario/${usuarioId}/recientes`,
    obtenerEstadisticas: (usuarioId: number) => `/api/v1/biblioteca/usuario/${usuarioId}/estadisticas`
};
