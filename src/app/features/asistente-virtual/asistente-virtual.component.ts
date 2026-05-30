import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsistenteFabComponent } from './components/asistente-fab/asistente-fab.component';
import { AsistentePanelComponent } from './components/asistente-panel/asistente-panel.component';
import { AsistenteVirtualPresenter } from './presenter/asistente-virtual.presenter';

@Component({
  selector: 'app-asistente-virtual',
  templateUrl: './asistente-virtual.component.html',
  styleUrl: './asistente-virtual.component.css',
  imports: [AsistenteFabComponent, AsistentePanelComponent],
  providers: [AsistenteVirtualPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsistenteVirtualComponent {
  protected readonly presenter = inject(AsistenteVirtualPresenter);
}
