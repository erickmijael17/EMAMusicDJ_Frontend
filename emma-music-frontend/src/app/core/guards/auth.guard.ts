import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioAutenticacion } from '../../domains/auth/services/auth.service';
import { map, take } from 'rxjs/operators';

export const guardAutenticacion: CanActivateFn = (route, state) => {
  const servicioAutenticacion = inject(ServicioAutenticacion);
  const router = inject(Router);

  return servicioAutenticacion.estaAutenticado$.pipe(
    take(1),
    map(estaAutenticado => {
      if (estaAutenticado) {
        return true;
      }

      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};
