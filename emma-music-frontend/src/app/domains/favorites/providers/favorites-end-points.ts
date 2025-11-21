export const FAVORITES_END_POINTS = {
  agregar: () => '/api/v1/favoritos/hibrido',
  eliminar: (usuarioId: number, videoId: string) => `/api/v1/favoritos/hibrido/${usuarioId}/${videoId}`,
  porUsuario: (usuarioId: number) => `/api/v1/favoritos/hibrido/usuario/${usuarioId}`,
  verificar: (usuarioId: number, videoId: string) => `/api/v1/favoritos/hibrido/verificar/${usuarioId}/${videoId}`,
  contar: (usuarioId: number) => `/api/v1/favoritos/hibrido/contar/${usuarioId}`
};



