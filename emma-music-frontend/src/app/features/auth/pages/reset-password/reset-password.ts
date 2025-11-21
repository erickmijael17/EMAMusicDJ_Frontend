import {Component, inject, OnInit, signal} from '@angular/core';
import {APP_ICONS} from '../../../../shared/icons/app-icons';
import {FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {passwordMatchValidator} from '../../../../domains/auth/models/register.model';
import {ServicioAutenticacion} from '../../../../domains/auth/services/auth.service';

export type FormResetPassword = FormGroup<{
  contrasena: FormControl<string>;
  confirmar_contrasena: FormControl<string>;
}>;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FaIconComponent,
    RouterLink
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {

  formResetPassword!: FormResetPassword;
  protected readonly iconos = APP_ICONS;

  private fbn = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicioAutenticacion = inject(ServicioAutenticacion);

  public isLoading = signal<boolean>(false);
  private token: string | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    // if (!this.token) {
    //   console.error('Token no encontrado. Redirigiendo a login.');
    //   this.router.navigate(['/login']);
    // }
    this.initForm();
  }

  private initForm(): void {
    this.formResetPassword = this.fbn.group({
      contrasena: this.fbn.control('', [Validators.required]),
      confirmar_contrasena: this.fbn.control('', [Validators.required]),
    },{
      validators: passwordMatchValidator
    });
  }

  public onSubmit(): void {
    if (this.formResetPassword.invalid) {
      this.formResetPassword.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    if (!this.token) {
      this.isLoading.set(false);
      console.error('Token no encontrado.');
      return;
    }
    const formValue = this.formResetPassword.getRawValue();
    const {confirmar_contrasena, ...payload} = formValue;
    this.servicioAutenticacion.restablecerPassword(payload, this.token)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error al restablecer contraseña:', err);
        }
      });
  }
}
