import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioApi {
  protected readonly http = inject(HttpClient);
  protected readonly urlApi = environment.apiUrl;

  protected obtener<T>(ruta: string, parametros?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<T> {
    const opciones = parametros ? { params: parametros } : {};
    return this.http.get<T>(`${this.urlApi}${ruta}`, opciones).pipe(
      catchError(error => this.manejarError(error))
    );
  }

  protected enviar<T>(ruta: string, cuerpo?: unknown, parametros?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<T> {
    const opciones: any = {};
    if (parametros) {
      opciones.params = parametros;
    }
    return this.http.post<T>(`${this.urlApi}${ruta}`, cuerpo || {}, opciones).pipe(
      map((response: any) => response as T),
      catchError(error => this.manejarError(error))
    );
  }

  protected actualizar<T>(ruta: string, cuerpo?: unknown): Observable<T> {
    return this.http.put<T>(`${this.urlApi}${ruta}`, cuerpo || {}).pipe(
      catchError(error => this.manejarError(error))
    );
  }

  protected eliminar<T>(ruta: string, cuerpo?: unknown): Observable<T> {
    const opciones = cuerpo ? { body: cuerpo } : {};
    return this.http.delete<T>(`${this.urlApi}${ruta}`, opciones).pipe(
      catchError(error => this.manejarError(error))
    );
  }

  protected manejarError(error: HttpErrorResponse): Observable<never> {
    let mensajeError = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      mensajeError = `Error: ${error.error.message}`;
    } else {
      const errorApi = error.error as any;

      switch (error.status) {
        case 400:
          mensajeError = errorApi?.message || 'Solicitud inválida. Por favor, verifica los datos enviados.';
          break;
        case 401:
          mensajeError = 'No autorizado. Por favor, inicia sesión.';
          break;
        case 403:
          mensajeError = errorApi?.message || 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          mensajeError = errorApi?.message || 'Recurso no encontrado.';
          break;
        case 409:
          mensajeError = errorApi?.message || 'Conflicto: el recurso ya existe o hay un problema con el estado actual.';
          break;
        case 500:
          mensajeError = 'Error del servidor. Por favor, intenta más tarde.';
          break;
        case 503:
          mensajeError = 'Servicio no disponible. Por favor, intenta más tarde.';
          break;
        default:
          mensajeError = `Error ${error.status}: ${errorApi?.message || error.message || 'Error desconocido'}`;
      }
    }

    console.error('Error en petición HTTP:', {
      status: error.status,
      mensaje: mensajeError,
      error: error.error
    });

    const errorConStatus = new Error(mensajeError) as Error & { status?: number };
    errorConStatus.status = error.status;

    return throwError(() => errorConStatus);
  }
}


