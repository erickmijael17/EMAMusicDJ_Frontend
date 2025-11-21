import { Routes } from '@angular/router';

export const PLAYLISTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/playlist-list/playlist-list').then(m => m.PlaylistList),
    title: 'Mis Playlists - Emma Music'
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/playlist-detail/playlist-detail').then(m => m.PlaylistDetail),
    title: 'Playlist - Emma Music'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/playlist-edit/playlist-edit').then(m => m.PlaylistEdit),
    title: 'Editar Playlist - Emma Music'
  }
];
