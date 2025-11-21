import {HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Observable} from 'rxjs';
import {ServicioAutenticacion} from '../../domains/auth/services/auth.service';
import {environment} from '../../../environments/environment';

export const interceptorAutenticacion: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const servicioAutenticacion = inject(ServicioAutenticacion);
  const token = servicioAutenticacion.obtenerToken();
  const esUrlApi = req.url.startsWith(environment.apiUrl);

  // --- INICIO: LOG DE DEPURACIÓN ---
  if (esUrlApi) {
    console.log(`[Interceptor] Petición saliente a: ${req.method} ${req.url}`);
    if (req.body) {
      console.log('[Interceptor] Cuerpo de la petición:', req.body);
    }
  }
  // --- FIN: LOG DE DEPURACIÓN ---

  if (token && esUrlApi) {
    const solicitudClonada = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(solicitudClonada);
  }

  return next(req);
};
