/**
 * Endpoints para las operaciones de música
 * Basados en el backend Spring Boot - API Emma Music
 */
export const MUSIC_END_POINTS = {
  hibrido: {
    buscar: '/api/v1/hibrido/buscar',
    reproducir: (videoId: string) => `/api/v1/hibrido/reproducir/${videoId}`,
    agregarAPlaylist: (listaId: number) => `/api/v1/hibrido/playlist/${listaId}/agregar`,
    migrarAutomatico: '/api/v1/hibrido/migrar-automatico',
    candidatasMigracion: '/api/v1/hibrido/candidatas-migracion',
    estadisticas: '/api/v1/hibrido/estadisticas'
  },

  metadatosYouTube: {
    obtener: (videoId: string) => `/api/v1/metadatos-youtube/${videoId}`,
    buscar: '/api/v1/metadatos-youtube/buscar',
    candidatasMigracion: '/api/v1/metadatos-youtube/candidatas-migracion',
    usadasPlaylists: '/api/v1/metadatos-youtube/usadas-playlists',
    incrementarReproducciones: (videoId: string) => `/api/v1/metadatos-youtube/${videoId}/incrementar-reproducciones`,
    incrementarPlaylists: (videoId: string) => `/api/v1/metadatos-youtube/${videoId}/incrementar-playlists`,
    limpiarAntiguos: '/api/v1/metadatos-youtube/limpiar-antiguos',
    estadisticas: '/api/v1/metadatos-youtube/estadisticas'
  },

  pistas: {
    listar: '/api/v1/pistas',
    obtener: (pistaId: number) => `/api/v1/pistas/${pistaId}`,
    buscar: '/api/v1/pistas/buscar',
    crear: '/api/v1/pistas',
    actualizar: (pistaId: number) => `/api/v1/pistas/${pistaId}`,
    eliminar: (pistaId: number) => `/api/v1/pistas/${pistaId}`,
    descargadas: '/api/v1/pistas/descargadas',
    estadisticasArchivos: '/api/v1/pistas/estadisticas/archivos'
  },

  favoritos: {
    agregar: (usuarioId: number, pistaId: number) => `/api/v1/favoritos/${usuarioId}/${pistaId}`,
    eliminar: (usuarioId: number, pistaId: number) => `/api/v1/favoritos/${usuarioId}/${pistaId}`,
    porUsuario: (usuarioId: number) => `/api/v1/favoritos/usuario/${usuarioId}`,
    verificar: (usuarioId: number, pistaId: number) => `/api/v1/favoritos/verificar/${usuarioId}/${pistaId}`,
    contar: (usuarioId: number) => `/api/v1/favoritos/contar/${usuarioId}`
  },

  youtube: {
    buscar: '/api/youtube/buscar',
    stream: (videoId: string) => `/api/youtube/stream/${videoId}`
  },

  albumes: {
    listar: '/api/v1/albumes',
    obtener: (albumId: number) => `/api/v1/albumes/${albumId}`,
    buscar: '/api/v1/albumes/buscar',
    porArtista: (artistaId: number) => `/api/v1/albumes/artista/${artistaId}`,
    porGenero: (genero: string) => `/api/v1/albumes/genero/${genero}`,
    porAnio: (anio: number) => `/api/v1/albumes/anio/${anio}`,
    rangoAnios: '/api/v1/albumes/rango-anios',
    buscarPorArtista: '/api/v1/albumes/buscar-por-artista',
    porTipo: (tipo: string) => `/api/v1/albumes/tipo/${tipo}`,
    recientes: '/api/v1/albumes/recientes',
    crear: '/api/v1/albumes',
    actualizar: (albumId: number) => `/api/v1/albumes/${albumId}`,
    eliminar: (albumId: number) => `/api/v1/albumes/${albumId}`,
    estadisticasArtista: (artistaId: number) => `/api/v1/albumes/estadisticas/artista/${artistaId}`,
    estadisticasGeneral: '/api/v1/albumes/estadisticas/general'
  },

  artistas: {
    listar: '/api/v1/artistas',
    obtener: (artistaId: number) => `/api/v1/artistas/${artistaId}`,
    buscar: '/api/v1/artistas/buscar',
    verificados: '/api/v1/artistas/verificados',
    porGenero: (genero: string) => `/api/v1/artistas/genero/${genero}`,
    crear: '/api/v1/artistas',
    actualizar: (artistaId: number) => `/api/v1/artistas/${artistaId}`,
    eliminar: (artistaId: number) => `/api/v1/artistas/${artistaId}`,
    estadisticas: 'api/v1/artistas/estadisticas'
  },

  // Historial de Reproducciones
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
  },

  // Endpoints de playlists (mantener compatibilidad)
  playlists: 'api/playlists',
  getPlaylistById: (id: number) => `api/playlists/${id}`,
  addTrackToPlaylist: (playlistId: number) =>
    `api/playlists/${playlistId}/tracks/search-and-add`,
  removeTrackFromPlaylist: (playlistId: number, trackId: number) =>
    `api/playlists/${playlistId}/tracks/${trackId}`,
  getPlaylistTrackStream: (playlistId: number, trackId: number) =>
    `api/playlists/${playlistId}/tracks/${trackId}/stream`,
  playPlaylist: (playlistId: number) =>
    `api/playlists/${playlistId}/play`,
  playPlaylistFromPosition: (playlistId: number, startPosition: number) =>
    `api/playlists/${playlistId}/play?startPosition=${startPosition}`
};
