export type ClaveRestriccion =
  | 'sinTacc'
  | 'sinAzucar'
  | 'sinSodio'
  | 'vegano'
  | 'contieneLacteos'
  | 'tieneMani'
  | 'contieneHuevo'
  | 'contienePescado'
  | 'contieneSoja'
  | 'aptoVegetariano';

export interface RestriccionesNutricionales {
  sinTacc: boolean;
  sinAzucar: boolean;
  sinSodio: boolean;
  vegano: boolean;
  contieneLacteos: boolean;
  tieneMani: boolean;
  contieneHuevo: boolean;
  contienePescado: boolean;
  contieneSoja: boolean;
  aptoVegetariano: boolean;
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

export interface ClasificacionSaludCatalogoItem {
  readonly id: string;
  readonly descripcion: string;
  readonly activo?: boolean;
}

export const RESTRICCIONES_CATALOGO: readonly DescriptorRestriccion[] = [
  {
    clave: 'sinTacc',
    titulo: 'TACC',
    descripcion: 'Bloquea productos con gluten.',
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
    descripcion: 'Bloquea productos con alto sodio.',
    icono: 'fa-heart-pulse',
    colorIcono: 'dorado',
    palabrasClave: ['sodio', 'sal'],
  },
  {
    clave: 'vegano',
    titulo: 'Apto Vegano',
    descripcion: 'Libre de productos animales.',
    icono: 'fa-leaf',
    colorIcono: 'menta',
    palabrasClave: ['vegan'],
  },
  {
    clave: 'contieneLacteos',
    titulo: 'Contiene Lácteos',
    descripcion: 'Bloquea productos con lácteos.',
    icono: 'fa-cow',
    colorIcono: 'melocoton',
    palabrasClave: ['lacteo'],
  },
  {
    clave: 'tieneMani',
    titulo: 'Tiene Maní',
    descripcion: 'Alerta para alergia al maní.',
    icono: 'fa-circle-exclamation',
    colorIcono: 'dorado',
    palabrasClave: ['mani'],
  },
  {
    clave: 'contieneHuevo',
    titulo: 'Contiene Huevo',
    descripcion: 'Alerta para alergia al huevo.',
    icono: 'fa-egg',
    colorIcono: 'dorado',
    palabrasClave: ['huevo'],
  },
  {
    clave: 'contienePescado',
    titulo: 'Contiene Pescado',
    descripcion: 'Alerta para alergia a pescados y mariscos.',
    icono: 'fa-fish',
    colorIcono: 'pizarra',
    palabrasClave: ['pescado', 'marisco'],
  },
  {
    clave: 'contieneSoja',
    titulo: 'Contiene Soja',
    descripcion: 'Alerta para alergia a la soja.',
    icono: 'fa-seedling',
    colorIcono: 'menta',
    palabrasClave: ['soja'],
  },
  {
    clave: 'aptoVegetariano',
    titulo: 'Apto Vegetariano',
    descripcion: 'Sin carne, permite lácteos y huevo.',
    icono: 'fa-carrot',
    colorIcono: 'menta',
    palabrasClave: ['vegetarian'],
  },
] as const;

export function restriccionesPorDefecto(): RestriccionesNutricionales {
  return {
    sinTacc: false,
    sinAzucar: false,
    sinSodio: false,
    vegano: false,
    contieneLacteos: false,
    tieneMani: false,
    contieneHuevo: false,
    contienePescado: false,
    contieneSoja: false,
    aptoVegetariano: false,
  };
}

export function normalizarDescripcion(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function obtenerClasificacionPorClave<T extends ClasificacionSaludCatalogoItem>(
  catalogo: readonly T[],
  clave: ClaveRestriccion,
): T | undefined {
  const descriptor = RESTRICCIONES_CATALOGO.find((item) => item.clave === clave);
  if (!descriptor) return undefined;

  return catalogo.find((clasificacion) => {
    if (clasificacion.activo === false) return false;
    const descripcion = normalizarDescripcion(clasificacion.descripcion ?? '');
    return descriptor.palabrasClave.some((palabra) => descripcion.includes(palabra));
  });
}

export function obtenerIdClasificacionPorClave(
  catalogo: readonly ClasificacionSaludCatalogoItem[],
  clave: ClaveRestriccion,
): string | null {
  return obtenerClasificacionPorClave(catalogo, clave)?.id ?? null;
}

export function ordenarClasificacionesSalud<T extends ClasificacionSaludCatalogoItem>(
  catalogo: readonly T[],
): T[] {
  const activas = catalogo.filter((clasificacion) => clasificacion.activo !== false);
  const agregadas = new Set<string>();
  const ordenadas: T[] = [];

  for (const descriptor of RESTRICCIONES_CATALOGO) {
    const match = obtenerClasificacionPorClave(activas, descriptor.clave);
    if (match && !agregadas.has(match.id)) {
      ordenadas.push(match);
      agregadas.add(match.id);
    }
  }

  return [
    ...ordenadas,
    ...activas.filter((clasificacion) => !agregadas.has(clasificacion.id)),
  ];
}
