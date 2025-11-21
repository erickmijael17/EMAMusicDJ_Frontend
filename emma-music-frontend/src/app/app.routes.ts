import { Routes } from '@angular/router';
import { guardAutenticacion } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guardAutenticacion],
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        loadComponent: () => import('./features/inicio/pages/inicio/inicio').then(m => m.Inicio)
      },
      {
        path: 'buscar',
        loadComponent: () => import('./features/buscar/pages/buscar/buscar').then(m => m.Buscar)
      },
      {
        path: 'playlists',
        loadChildren: () => import('./features/playlists/playlists.routes').then(m => m.PLAYLISTS_ROUTES)
      },
      {
        path: 'biblioteca',
        loadComponent: () => import('./features/biblioteca/pages/biblioteca/biblioteca').then(m => m.Biblioteca),
        title: 'Biblioteca - Emma Music'
      },
      {
        path: 'mi-perfil',
        loadComponent: () => import('./features/mi-perfil/pages/mi-perfil/mi-perfil').then(m => m.MiPerfil),
        title: 'Mi Perfil - Emma Music'
      }
    ]
  },

  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-layout/auth-layout').then(m => m.AuthLayout),
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  }
];
