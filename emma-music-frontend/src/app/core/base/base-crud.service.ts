import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServicioApi } from './api.service';

@Injectable()
export abstract class BaseCrudService<T, C = any, U = any> extends ServicioApi {
  protected abstract endPoint: string;

  /**
   * Obtener todos los registros
   */
  public getAll$(): Observable<T[]> {
    return this.obtener<T[]>(this.endPoint);
  }

  /**
   * Obtener un registro por ID
   * @param id Identificador del registro
   */
  public getById$(id: number | string): Observable<T> {
    return this.obtener<T>(`${this.endPoint}/${id}`);
  }

  /**
   * Crear un nuevo registro
   * @param entity Datos para crear el registro
   */
  public add$(entity: C): Observable<T> {
    return this.enviar<T>(this.endPoint, entity);
  }

  /**
   * Actualizar un registro existente
   * @param id Identificador del registro
   * @param entity Datos para actualizar el registro
   */
  public update$(id: number | string, entity: U): Observable<T> {
    return this.actualizar<T>(`${this.endPoint}/${id}`, entity);
  }

  /**
   * Eliminar un registro
   * @param id Identificador del registro
   */
  public delete$(id: number | string): Observable<void> {
    return this.eliminar<void>(`${this.endPoint}/${id}`);
  }
}
