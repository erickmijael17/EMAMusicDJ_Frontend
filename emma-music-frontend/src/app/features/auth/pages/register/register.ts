import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {formRegister, passwordMatchValidator} from '../../../../domains/auth/models/register.model';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {APP_ICONS, AppIconsMap} from '../../../../shared/icons/app-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {finalize, takeUntil} from 'rxjs';
import {ServicioAutenticacion} from '../../../../domains/auth/services/auth.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FaIconComponent, NgClass],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  formRegister!: formRegister;

  protected readonly iconos: AppIconsMap = APP_ICONS;

  private fbn = inject(NonNullableFormBuilder);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public isLoading = signal<boolean>(false);
  public passwordVisible = signal<boolean>(false);
  public confirmarPasswordVisible = signal<boolean>(false);
  public errorRegistro = signal<string | null>(null);

  ngOnInit() {
    this.initFormRegister();
  }

  public initFormRegister() {
    this.formRegister = this.fbn.group({
      nombre: this.fbn.control(''),
      apellido: this.fbn.control(''),
      nombreUsuario: this.fbn.control('', [Validators.required, Validators.minLength(3)]),
      email: this.fbn.control('', [Validators.required, Validators.email]),
      contrasena: this.fbn.control('',[Validators.required, Validators.minLength(6)]),
      confirmar_contrasena: this.fbn.control('', [Validators.required, Validators.minLength(6)]),
    },{
      validators: passwordMatchValidator
    });
  }

  public onSubmit() {
    if (this.formRegister.invalid) {
      this.errorRegistro.set('Por favor, completa todos los campos requeridos correctamente.');
      this.formRegister.markAllAsTouched();
      return;
    }
    this.errorRegistro.set(null);
    this.isLoading.set(true);

    const formValue = this.formRegister.getRawValue();
    const { confirmar_contrasena, ...payload } = formValue;

    this.servicioAutenticacion.registrar(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (response) => {
        console.log('Registro y login exitosos:', response);
        this.router.navigate(['/inicio']); // Redirigir a la página principal
      },
      error: (err) => {
        this.errorRegistro.set(err.message || 'Ocurrió un error durante el registro. Inténtalo de nuevo.');
        console.error('Error en registro:', err);
      }
    });
  }

  public alternarVisibilidadPassword(campo: 'password' | 'confirmar'): void {
    if (campo === 'password') {
      this.passwordVisible.update(v => !v);
    } else {
      this.confirmarPasswordVisible.update(v => !v);
    }
  }
}
