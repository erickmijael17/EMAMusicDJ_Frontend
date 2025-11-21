export const PLAYLIST_END_POINTS = {
  crear: '/api/v1/playlists',
  obtener: (listaId: number) => `/api/v1/playlists/${listaId}`,
  obtenerPorUsuario: (usuarioId: number) => `/api/v1/playlists/usuario/${usuarioId}`,
  obtenerPublicas: '/api/v1/playlists/publicas',
  buscar: '/api/v1/playlists/buscar',
  actualizar: (listaId: number) => `/api/v1/playlists/${listaId}`,
  eliminar: (listaId: number) => `/api/v1/playlists/${listaId}`,
  cambiarVisibilidad: (listaId: number) => `/api/v1/playlists/${listaId}/visibilidad`,
  cambiarModoColaborativo: (listaId: number) => `/api/v1/playlists/${listaId}/colaborativa`,
  contarPorUsuario: (usuarioId: number) => `/api/v1/playlists/usuario/${usuarioId}/count`,

  canciones: {
    obtener: (listaId: number) => `/api/v1/playlists/${listaId}/canciones`,
    agregar: (listaId: number) => `/api/v1/playlists/${listaId}/canciones`,
    agregarPista: (listaId: number) => `/api/v1/playlists/${listaId}/canciones/agregar-pista`,
    agregarMultiples: (listaId: number) => `/api/v1/playlists/${listaId}/canciones/agregar-multiples`,
    eliminar: (listaId: number, videoId: string) => `/api/v1/playlists/${listaId}/canciones/${videoId}`,
    eliminarTodas: (listaId: number) => `/api/v1/playlists/${listaId}/canciones/todas`,
    reordenar: (listaId: number, videoId: string) => `/api/v1/playlists/${listaId}/canciones/${videoId}/reordenar`,
    contarTotal: (listaId: number) => `/api/v1/playlists/${listaId}/total`,
    estadisticas: (listaId: number) => `/api/v1/playlists/${listaId}/canciones/estadisticas`,
    buscar: (listaId: number) => `/api/v1/playlists/${listaId}/canciones/buscar`,
    migrarTemporales: (listaId: number) => `/api/v1/playlists/${listaId}/canciones/migrar-temporales`
  }

};



