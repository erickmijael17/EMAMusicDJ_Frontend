import {AbstractControl, FormControl, FormGroup, ValidationErrors} from '@angular/forms';

export type formRegister = FormGroup<{
  nombre: FormControl<string>;
  apellido: FormControl<string>;
  nombreUsuario: FormControl<string>;
  email: FormControl<string>;
  contrasena: FormControl<string>;
  confirmar_contrasena: FormControl<string>;
}>;

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('contrasena');
  const confirmPassword = control.get('confirmar_contrasena');

  if (!password || !confirmPassword || confirmPassword.pristine) {
    return null;
  }
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}
