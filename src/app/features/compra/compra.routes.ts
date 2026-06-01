import { Routes } from '@angular/router';

export const compraRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./carrito/carrito.page').then((m) => m.CarritoPage),
  },
  {
    path: 'confirmar',
    loadComponent: () =>
      import('./confirmar/confirmar.page').then((m) => m.ConfirmarPage),
  },
  {
    path: 'exito',
    loadComponent: () =>
      import('./exito/exito.page').then((m) => m.ExitoPage),
  },
];
