import { Routes } from '@angular/router';

export const ventaEspontaneaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./venta-espontanea-page.component').then(
        (m) => m.VentaEspontaneaPageComponent,
      ),
  },
];
