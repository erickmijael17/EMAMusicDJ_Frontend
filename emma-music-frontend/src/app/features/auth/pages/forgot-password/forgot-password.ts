import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {APP_ICONS} from '../../../../shared/icons/app-icons';
import {RouterLink} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {ServicioAutenticacion} from '../../../../domains/auth/services/auth.service';

export type ForgotPasswordForm = FormGroup<{
  correo_electronico: FormControl<string>;
}>

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FaIconComponent
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword implements OnInit {

  formForgotPassword!: ForgotPasswordForm;

  protected readonly iconos = APP_ICONS;

  private fbn = inject(NonNullableFormBuilder);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  public isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.formForgotPassword = this.fbn.group({
      correo_electronico: this.fbn.control('', [Validators.required, Validators.email]),
    });
  }

  public onSubmit(): void {
    if (this.formForgotPassword.invalid) {
      this.formForgotPassword.markAllAsTouched();
      return;
    }

    // this.isLoading.set(true);
    // const payload = this.formForgotPassword.getRawValue();
    // this.authService.forgotPassword(payload)
    //   .subscribe({
    //     next: () => this.isLoading.set(false),
    //     error: (err) => {
    //       this.isLoading.set(false);
    //       console.error('Error solicitando reseteo:', err);
    //     }
    //   });
  }
}
