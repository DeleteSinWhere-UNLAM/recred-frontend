export type PayoutConfigUnidadIntervalo = 'DAYS' | 'WEEKS' | 'MONTHS';
export type PayoutConfigEstado = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface PayoutConfig {
  readonly kiosqueroId?: string;
  readonly destinationCvu: string;
  readonly destinationCuit: string;
  readonly accountHolderName: string;
  readonly cantidadIntervalo: number;
  readonly unidadIntervalo: PayoutConfigUnidadIntervalo;
  readonly estado: PayoutConfigEstado;
  readonly proximaEjecucion?: string | null;
  readonly ultimaEjecucion?: string | null;
}
