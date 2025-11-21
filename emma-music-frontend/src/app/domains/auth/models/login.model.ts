import {FormControl, FormGroup} from '@angular/forms';

export type FormLogin = FormGroup<{
  email: FormControl<string>;
  contrasena: FormControl<string>;
}>
