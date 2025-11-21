export const PLAYBACK_END_POINTS = {
  reproducciones: {
    crear: 'api/v1/reproducciones',
    porUsuario: (usuarioId: number) => `api/v1/reproducciones/usuario/${usuarioId}`,
    porPista: (pistaId: number) => `api/v1/reproducciones/pista/${pistaId}`,
    porVideo: (videoId: string) => `api/v1/reproducciones/video/${videoId}`,
    porUsuarioFecha: (usuarioId: number) => `api/v1/reproducciones/usuario/${usuarioId}/fecha`,
    porUsuarioPista: (usuarioId: number, pistaId: number) => `api/v1/reproducciones/usuario/${usuarioId}/pista/${pistaId}`,
    recientes: (usuarioId: number) => `api/v1/reproducciones/usuario/${usuarioId}/recientes`,
    contarPorUsuario: (usuarioId: number) => `api/v1/reproducciones/contar/usuario/${usuarioId}`,
    contarPorPista: (pistaId: number) => `api/v1/reproducciones/contar/pista/${pistaId}`,
    contarPorVideo: (videoId: string) => `api/v1/reproducciones/contar/video/${videoId}`,
    estadisticasUsuario: (usuarioId: number) => `api/v1/reproducciones/estadisticas/usuario/${usuarioId}`,
    pistasPopulares: 'api/v1/reproducciones/estadisticas/pistas-populares'
  }
};



