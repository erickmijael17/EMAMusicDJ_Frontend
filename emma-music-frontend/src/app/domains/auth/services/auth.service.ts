import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {AUTH_END_POINTS} from '../providers/auth-end-points';
import {Router} from '@angular/router';

export interface DtoPeticionInicioSesion {
  email: string;
  contrasena: string;
}

export interface DtoPeticionRegistro {
  nombreUsuario: string;
  email: string;
  contrasena: string;
  nombre?: string;
  apellido?: string;
}

export interface DtoPeticionRestablecerContrasena {
  correo_electronico: string;
}

export interface DtoConfirmarRestablecerContrasena {
  token: string;
  nuevaPassword: string;
}

export interface DtoActualizarPerfil {
  nombre?: string;
  apellido?: string;
  nombreUsuario?: string;
  email?: string;
  urlImagenPerfil?: string;
}

export interface DtoRespuestaAutenticacion {
  usuarioId: number;
  nombreUsuario: string;
  email: string;
  nombre?: string;
  apellido?: string;
  urlImagenPerfil?: string;
  nivelSuscripcion?: string;
  estaActivo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimoLogin?: string;
  token: string;
}

export interface DtoRespuestaUsuario {
  usuarioId: number;
  nombreUsuario: string;
  email: string;
  nombre?: string;
  apellido?: string;
  urlImagenPerfil?: string;
  nivelSuscripcion?: string;
}

const CLAVE_TOKEN_AUTH = 'auth_token';
const CLAVE_USUARIO_ACTUAL = 'current_user';

@Injectable({
  providedIn: 'root'
})
export class ServicioAutenticacion {

  private _estaAutenticado = new BehaviorSubject<boolean>(false);
  public estaAutenticado$ = this._estaAutenticado.asObservable();

  private _usuarioActual = new BehaviorSubject<DtoRespuestaUsuario | null>(null);
  public usuarioActual$ = this._usuarioActual.asObservable();

  private http = inject(HttpClient);
  private readonly _urlApi = environment.apiUrl ?? environment.apiUrl;
  private readonly _endpoints = AUTH_END_POINTS;
  private router = inject(Router);

  constructor() {
    this.cargarEstadoInicial();
  }

  private cargarEstadoInicial(): void {
    const token = localStorage.getItem(CLAVE_TOKEN_AUTH);
    const usuario = localStorage.getItem(CLAVE_USUARIO_ACTUAL);
    if (token && usuario) {
      this._estaAutenticado.next(true);
      this._usuarioActual.next(JSON.parse(usuario));
    }
  }

  public iniciarSesion(payload: DtoPeticionInicioSesion): Observable<DtoRespuestaAutenticacion> {
    return this.http.post<DtoRespuestaAutenticacion>(`${this._urlApi}${this._endpoints.login}`, payload).pipe(
      tap(respuesta => {
        console.log('Respuesta de login estructura completa:', respuesta);
        this.establecerToken(respuesta.token);
        const datosUsuario: DtoRespuestaUsuario = this.mapearRespuestaLogin(respuesta);
        this.establecerUsuarioActual(datosUsuario);
      })
    );
  }

  public registrar(payload: DtoPeticionRegistro): Observable<DtoRespuestaAutenticacion> {
    // --- INICIO: LOG DE DEPURACIÓN ---
    console.log('[Auth Service] Payload recibido para registrar:', payload);
    // --- FIN: LOG DE DEPURACIÓN ---

    return this.http.post<DtoRespuestaAutenticacion>(`${this._urlApi}${this._endpoints.register}`, payload).pipe(
      tap(respuesta => {
        this.establecerSesion(respuesta);
      })
    );
  }

  public olvidarPassword(payload: { correo_electronico: string }): Observable<{ message: string }> {
    const cuerpo = { email: payload.correo_electronico };
    return this.http.post<{ message: string }>(`${this._urlApi}${this._endpoints.forgotPassword}`, cuerpo);
  }

  public restablecerPassword(payload: { contrasena: string; confirmar_contrasena?: string }, token: string): Observable<{ message: string }> {
    const cuerpo = { token, nuevaPassword: payload.contrasena };
    return this.http.post<{ message: string }>(`${this._urlApi}${this._endpoints.resetPassword}`, cuerpo);
  }

  private establecerSesion(respuesta: DtoRespuestaAutenticacion): void {
    this.establecerToken(respuesta.token);
    const datosUsuario = this.mapearRespuestaLogin(respuesta);
    this.establecerUsuarioActual(datosUsuario);
  }

  private establecerToken(token: string): void {
    localStorage.setItem(CLAVE_TOKEN_AUTH, token);
    this._estaAutenticado.next(true);
  }

  private establecerUsuarioActual(usuario: DtoRespuestaUsuario): void {
    localStorage.setItem(CLAVE_USUARIO_ACTUAL, JSON.stringify(usuario));
    this._usuarioActual.next(usuario);
  }

  public obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN_AUTH);
  }

  public depurarInformacionToken(): void {
    const token = this.obtenerToken();
    const usuario = localStorage.getItem(CLAVE_USUARIO_ACTUAL);
    console.log('Información de depuración del token:');
    console.log('Token existe:', !!token);
    console.log('Vista previa del token:', token ? token.substring(0, 50) + '...' : 'No hay token');
    console.log('Usuario existe:', !!usuario);
    console.log('Datos del usuario:', usuario ? JSON.parse(usuario) : 'No hay usuario');
    console.log('Está autenticado:', this._estaAutenticado.value);
  }

  private mapearRespuestaLogin(respuesta: DtoRespuestaAutenticacion): DtoRespuestaUsuario {
    console.log('Mapeando respuesta real del backend...');

    const { token, estaActivo, fechaCreacion, fechaActualizacion, ultimoLogin, ...datosUsuario } = respuesta;

    return {
      ...datosUsuario,
      nombre: datosUsuario.nombre || undefined,
      apellido: datosUsuario.apellido || undefined,
      urlImagenPerfil: datosUsuario.urlImagenPerfil || undefined,
      nivelSuscripcion: datosUsuario.nivelSuscripcion || 'gratis'
    };
  }

  public estaLogueado(): boolean {
    const token = this.obtenerToken();
    const usuario = localStorage.getItem(CLAVE_USUARIO_ACTUAL);
    return !!(token && usuario);
  }

  public obtenerUsuarioActual(): DtoRespuestaUsuario | null {
    return this._usuarioActual.value;
  }

  public cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN_AUTH);
    localStorage.removeItem(CLAVE_USUARIO_ACTUAL);
    this._estaAutenticado.next(false);
    this._usuarioActual.next(null);
    this.router.navigate(['/auth/login']);
  }

  public actualizarPerfil(usuarioId: number, datos: DtoActualizarPerfil): Observable<DtoRespuestaUsuario> {
    return this.http.put<DtoRespuestaUsuario>(
      `${this._urlApi}${this._endpoints.actualizarPerfil(usuarioId)}`,
      datos
    ).pipe(
      tap(usuarioActualizado => {
        this.establecerUsuarioActual(usuarioActualizado);
        console.log('Perfil actualizado exitosamente');
      })
    );
  }

  public obtenerPerfilCompleto(usuarioId: number): Observable<DtoRespuestaUsuario> {
    return this.http.get<DtoRespuestaUsuario>(
      `${this._urlApi}${this._endpoints.obtenerPerfil(usuarioId)}`
    ).pipe(
      tap(usuario => {
        this.establecerUsuarioActual(usuario);
      })
    );
  }
}
