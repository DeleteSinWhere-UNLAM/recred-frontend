export type ClaveRestriccion =
  | 'sinTacc'
  | 'sinAzucar'
  | 'alergiaMani'
  | 'vegano';

export interface RestriccionesNutricionales {
  sinTacc: boolean;
  sinAzucar: boolean;
  alergiaMani: boolean;
  vegano: boolean;
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
    titulo: 'Sin TACC (Celíaco)',
    descripcion: 'Bloquea productos con gluten.',
    icono: 'fa-wheat-awn-circle-exclamation',
    colorIcono: 'melocoton',
    palabrasClave: ['tacc', 'gluten', 'celiac'],
  },
  {
    clave: 'sinAzucar',
    titulo: 'Sin Azúcar Agregada',
    descripcion: 'Perfil apto para diabéticos.',
    icono: 'fa-cubes-stacked',
    colorIcono: 'pizarra',
    palabrasClave: ['azucar', 'diabet'],
  },
  {
    clave: 'alergiaMani',
    titulo: 'Alergia al Maní',
    descripcion: 'Bloquea snacks y trazas.',
    icono: 'fa-seedling',
    colorIcono: 'dorado',
    palabrasClave: ['mani'],
  },
  {
    clave: 'vegano',
    titulo: 'Menú Vegano',
    descripcion: 'Libre de productos animales.',
    icono: 'fa-leaf',
    colorIcono: 'menta',
    palabrasClave: ['vegan'],
  },
] as const;

export function restriccionesPorDefecto(): RestriccionesNutricionales {
  return {
    sinTacc: false,
    sinAzucar: false,
    alergiaMani: false,
    vegano: false,
  };
}

export function normalizarDescripcion(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
