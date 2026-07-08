export type NivelRecompensa = 'PRINCIPIANTE' | 'CRACK' | 'GOAT';

export interface StudentRewardStatus {
  puntajeTotal: number;
  nivelGlobal: NivelRecompensa;
  mensajeMotivacional: string;
  puntosFaltantes: number;
  proximoNivel: NivelRecompensa | null;
  porcentajeProgreso: number;
}
