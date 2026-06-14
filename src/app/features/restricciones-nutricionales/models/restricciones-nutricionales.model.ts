export type ClaveRestriccion =
  | 'sinTacc'
  | 'sinAzucar'
  | 'sinSodio'
  | 'vegano'
  | 'contieneLacteos';

export interface RestriccionesNutricionales {
  sinTacc: boolean;
  sinAzucar: boolean;
  sinSodio: boolean;
  vegano: boolean;
  contieneLacteos: boolean;
}

export type ColorIcono = 'melocoton' | 'pizarra' | 'dorado' | 'menta';

export interface DescriptorRestriccion {
  clave: ClaveRestriccion;
  titulo: string;
  descripcion: string;
  icono: string;
  colorIcono: ColorIcono;
  palabrasClave: readonly string[];
}

export const RESTRICCIONES_CATALOGO: readonly DescriptorRestriccion[] = [
  {
    clave: 'sinTacc',
    titulo: 'TACC',
    descripcion: 'Bloques productos con gluten.',
    icono: 'fa-wheat-awn',
    colorIcono: 'melocoton',
    palabrasClave: ['tacc', 'gluten', 'celiac'],
  },
  {
    clave: 'sinAzucar',
    titulo: 'Azúcar',
    descripcion: 'Perfil apto para diabético.',
    icono: 'fa-cubes-stacked',
    colorIcono: 'pizarra',
    palabrasClave: ['azucar', 'diabet'],
  },
  {
    clave: 'sinSodio',
    titulo: 'Sin Sodio',
    descripcion: 'Bloques productos con alto sodio.',
    icono: 'fa-heart-pulse',
    colorIcono: 'dorado',
    palabrasClave: ['sodio', 'sal'],
  },
  {
    clave: 'vegano',
    titulo: 'Vegano',
    descripcion: 'Libre de productos animales.',
    icono: 'fa-leaf',
    colorIcono: 'menta',
    palabrasClave: ['vegan'],
  },
  {
    clave: 'contieneLacteos',
    titulo: 'Contiene Lácteos',
    descripcion: 'Bloques productos con lácteos.',
    icono: 'fa-cow',
    colorIcono: 'melocoton',
    palabrasClave: ['lacteo'],
  },
] as const;

export function restriccionesPorDefecto(): RestriccionesNutricionales {
  return {
    sinTacc: false,
    sinAzucar: false,
    sinSodio: false,
    vegano: false,
    contieneLacteos: false,
  };
}

export function normalizarDescripcion(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
