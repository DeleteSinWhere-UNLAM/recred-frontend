import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ImportarTutoresPresenter } from './presenter/importar-tutores.presenter';

@Component({
  selector: 'app-importar-tutores-page',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './importar-tutores.page.html',
  styleUrl: './importar-tutores.page.css',
  providers: [ImportarTutoresPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportarTutoresPage {
  protected readonly presenter = inject(ImportarTutoresPresenter);
  protected readonly archivoSeleccionado = signal<File | null>(null);
  protected readonly errorArchivo = signal<string | null>(null);

  protected onArchivoElegido(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorArchivo.set(null);

    if (!archivo) {
      this.archivoSeleccionado.set(null);
      return;
    }

    const esCsv =
      archivo.type === 'text/csv' ||
      archivo.name.toLowerCase().endsWith('.csv');

    if (!esCsv) {
      this.errorArchivo.set('El archivo debe ser un CSV.');
      this.archivoSeleccionado.set(null);
      input.value = '';
      return;
    }

    this.archivoSeleccionado.set(archivo);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const archivo = this.archivoSeleccionado();
    if (!archivo || this.presenter.loading()) return;
    await this.presenter.importar(archivo);
  }

  protected importarOtro(): void {
    this.presenter.limpiar();
    this.archivoSeleccionado.set(null);
    this.errorArchivo.set(null);
  }
}
