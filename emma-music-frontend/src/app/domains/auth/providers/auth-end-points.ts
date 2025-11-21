export const AUTH_END_POINTS = {
  login: '/api/auth/iniciarSesion',
  register: '/api/auth/crear',
  forgotPassword: '/api/auth/password/reset-request',
  resetPassword: '/api/auth/password/reset-confirm',
  actualizarPerfil: (usuarioId: number) => `/api/usuarios/${usuarioId}`,
  obtenerPerfil: (usuarioId: number) => `/api/usuarios/${usuarioId}`,
};
