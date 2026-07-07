import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

type PlanVendedorCarga = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';
type PlanRequeridoCarga = 'INTERMEDIO' | 'AVANZADO';

@Component({
  selector: 'app-upload-selection-modal',
  standalone: true,
  templateUrl: './modal-seleccion-carga.component.html',
  styleUrl: './modal-seleccion-carga.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSeleccionCargaComponent {
  @Input() planActual: PlanVendedorCarga = 'AVANZADO';
  @Output() iaUpload = new EventEmitter<void>();
  @Output() manualUpload = new EventEmitter<void>();
  @Output() bulkUpload = new EventEmitter<void>();
  @Output() planBlocked = new EventEmitter<'Intermedio' | 'Avanzado'>();
  @Output() closeModal = new EventEmitter<void>();

  onIaUpload(): void {
    if (this.emitirBloqueoSiCorresponde('INTERMEDIO')) return;
    this.iaUpload.emit();
  }

  onManualUpload(): void {
    this.manualUpload.emit();
  }

  onBulkUpload(): void {
    if (this.emitirBloqueoSiCorresponde('AVANZADO')) return;
    this.bulkUpload.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }

  protected opcionBloqueada(planRequerido: PlanRequeridoCarga): boolean {
    return this.nivelPlan(this.planActual) < this.nivelPlan(planRequerido);
  }

  protected badgePlan(planRequerido: PlanRequeridoCarga): 'Intermedio' | 'Avanzado' {
    return planRequerido === 'AVANZADO' ? 'Avanzado' : 'Intermedio';
  }

  private emitirBloqueoSiCorresponde(planRequerido: PlanRequeridoCarga): boolean {
    if (!this.opcionBloqueada(planRequerido)) return false;
    this.planBlocked.emit(this.badgePlan(planRequerido));
    return true;
  }

  private nivelPlan(plan: PlanVendedorCarga | PlanRequeridoCarga): number {
    if (plan === 'AVANZADO') return 2;
    if (plan === 'INTERMEDIO') return 1;
    return 0;
  }
}
