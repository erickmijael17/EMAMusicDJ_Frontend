export const YOUTUBE_END_POINTS = {
  buscar: '/api/youtube/buscar',
  stream: (videoId: string) => `/api/youtube/stream/${videoId}`,
  hibrido: {
    buscar: '/api/v1/hibrido/buscar',
    reproducir: (videoId: string) => `/api/v1/hibrido/reproducir/${videoId}`,
    agregarAPlaylist: (listaId: number) => `/api/v1/hibrido/playlist/${listaId}/agregar`
  },
  metadatos: {
    obtener: (videoId: string) => `/api/v1/metadatos-youtube/${videoId}`,
    buscar: '/api/v1/metadatos-youtube/buscar',
    candidatasMigracion: '/api/v1/metadatos-youtube/candidatas-migracion',
    usadasPlaylists: '/api/v1/metadatos-youtube/usadas-playlists',
    incrementarReproducciones: (videoId: string) => `/api/v1/metadatos-youtube/${videoId}/incrementar-reproducciones`,
    incrementarPlaylists: (videoId: string) => `/api/v1/metadatos-youtube/${videoId}/incrementar-playlists`,
    limpiarAntiguos: '/api/v1/metadatos-youtube/limpiar-antiguos',
    estadisticas: '/api/v1/metadatos-youtube/estadisticas'
  }
};



