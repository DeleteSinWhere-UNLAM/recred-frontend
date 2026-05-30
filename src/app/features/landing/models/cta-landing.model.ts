export type VarianteCta = 'primario' | 'secundario';

export interface CtaLanding {
  readonly texto: string;
  readonly ruta: string;
  readonly variante: VarianteCta;
}
