import { Routes } from '@angular/router';

export const recuperarPasswordRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./solicitar-codigo/solicitar-codigo.page').then(
        (m) => m.SolicitarCodigoPage,
      ),
  },
  {
    path: 'codigo',
    loadComponent: () =>
      import('./validar-codigo/validar-codigo.page').then(
        (m) => m.ValidarCodigoPage,
      ),
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./nueva-password/nueva-password.page').then(
        (m) => m.NuevaPasswordPage,
      ),
  },
];
