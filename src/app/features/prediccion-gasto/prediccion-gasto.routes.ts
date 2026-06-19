import { Routes } from '@angular/router';
import { PrediccionGastoPage } from './prediccion-gasto.page';

export const PREDICCION_GASTO_ROUTES: Routes = [
  {
    path: '',
    component: PrediccionGastoPage
  },
  {
    path: ':alumnoId',
    component: PrediccionGastoPage
  }
];
