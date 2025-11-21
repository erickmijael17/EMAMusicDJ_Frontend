export const HISTORIAL_END_POINTS = {
    registrar: '/api/v1/historial/registrar',
    obtenerPaginado: (usuarioId: number) => `/api/v1/historial/usuario/${usuarioId}`,
    obtenerReciente: (usuarioId: number) => `/api/v1/historial/usuario/${usuarioId}/reciente`,
    obtenerPorVideo: (usuarioId: number, videoId: string) =>
        `/api/v1/historial/usuario/${usuarioId}/video/${videoId}`,
    contador: (usuarioId: number) => `/api/v1/historial/usuario/${usuarioId}/contador`,
    limpiar: (usuarioId: number) => `/api/v1/historial/usuario/${usuarioId}/limpiar`,
    eliminar: (reproduccionId: number) => `/api/v1/historial/${reproduccionId}`
};
