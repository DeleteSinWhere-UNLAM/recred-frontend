import { Routes } from '@angular/router';
import { PrediccionGastoPageComponent } from './prediccion-gasto-page/prediccion-gasto-page.component';

export const PREDICCION_GASTO_ROUTES: Routes = [
  {
    path: '',
    component: PrediccionGastoPageComponent
  },
  {
    path: ':alumnoId',
    component: PrediccionGastoPageComponent
  }
];
