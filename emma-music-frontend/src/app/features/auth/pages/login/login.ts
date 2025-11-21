import {Component, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink, ActivatedRoute} from '@angular/router';
import {FormLogin} from '../../../../domains/auth/models/login.model';
import {finalize} from 'rxjs';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {APP_ICONS} from '../../../../shared/icons/app-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {ServicioAutenticacion, DtoRespuestaAutenticacion} from '../../../../domains/auth/services/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    FaIconComponent,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {

  formLogin!: FormLogin;

  protected readonly iconos = APP_ICONS;

  private fbn = inject(NonNullableFormBuilder);
  private servicioAutenticacion = inject(ServicioAutenticacion);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public estaCargando = signal<boolean>(false);
  public passwordVisible = signal<boolean>(false);
  public errorLogin = signal<string | null>(null);

  ngOnInit(): void {
    this.inicializarFormularioLogin();
  }

  public inicializarFormularioLogin() {
    this.formLogin = this.fbn.group({
      email: this.fbn.control('', [Validators.required, Validators.email]),
      contrasena: this.fbn.control('', [Validators.required]),
    });
  }

  public alternarVisibilidadPassword(): void {
    this.passwordVisible.update(value => !value);
  }

  onSubmit() {
    this.errorLogin.set(null);
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }
    this.estaCargando.set(true);
    const payload = this.formLogin.getRawValue();
    this.servicioAutenticacion.iniciarSesion(payload)
      .pipe(finalize(() => this.estaCargando.set(false)))
      .subscribe({
        next: (respuesta: DtoRespuestaAutenticacion) => {
          const tieneTokenValido = respuesta && respuesta.token;
          if (tieneTokenValido) {
            const urlRetorno = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.router.navigateByUrl(urlRetorno);
          } else {
            console.error('Respuesta de login inválida:', respuesta);
            this.errorLogin.set('Error en el servidor. Inténtalo de nuevo.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorLogin.set('El correo electrónico o la contraseña son incorrectos.');
          console.error('Error en login:', err);
        }
      });
  }
}
