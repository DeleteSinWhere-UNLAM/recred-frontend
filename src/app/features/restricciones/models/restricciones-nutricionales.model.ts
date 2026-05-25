export type ClaveRestriccion =
  | 'sinTacc'
  | 'sinAzucar'
  | 'alergiaMani'
  | 'vegano';

export interface RestriccionesNutricionales {
  alumnoId: string;
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
}

export const RESTRICCIONES_CATALOGO: readonly DescriptorRestriccion[] = [
  {
    clave: 'sinTacc',
    titulo: 'Sin TACC (Celíaco)',
    descripcion: 'Bloquea productos con gluten.',
    icono: 'fa-wheat-awn-circle-exclamation',
    colorIcono: 'melocoton',
  },
  {
    clave: 'sinAzucar',
    titulo: 'Sin Azúcar Agregada',
    descripcion: 'Perfil apto para diabéticos.',
    icono: 'fa-cubes-stacked',
    colorIcono: 'pizarra',
  },
  {
    clave: 'alergiaMani',
    titulo: 'Alergia al Maní',
    descripcion: 'Bloquea snacks y trazas.',
    icono: 'fa-seedling',
    colorIcono: 'dorado',
  },
  {
    clave: 'vegano',
    titulo: 'Menú Vegano',
    descripcion: 'Libre de productos animales.',
    icono: 'fa-leaf',
    colorIcono: 'menta',
  },
] as const;

export function restriccionesPorDefecto(alumnoId: string): RestriccionesNutricionales {
  return {
    alumnoId,
    sinTacc: false,
    sinAzucar: false,
    alergiaMani: false,
    vegano: false,
  };
}
