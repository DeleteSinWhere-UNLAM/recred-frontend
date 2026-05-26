import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'restricciones/:alumnoId',
    loadComponent: () =>
      import('./features/restricciones/restricciones.page').then(
        (m) => m.RestriccionesPage
      ),
  },
  {
    path: 'buffet/:alumnoId',
    loadComponent: () =>
      import('./features/buffet/buffet.page').then((m) => m.BuffetPage),
  },
];
