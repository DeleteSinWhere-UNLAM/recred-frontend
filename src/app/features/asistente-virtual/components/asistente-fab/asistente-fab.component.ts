import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-asistente-fab',
  templateUrl: './asistente-fab.component.html',
  styleUrl: './asistente-fab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsistenteFabComponent {
  @Input() oculto = false;
  @Input() mostrarBadge = true;

  @Output() togglePanel = new EventEmitter<void>();

  protected onClick(): void {
    this.togglePanel.emit();
  }
}
