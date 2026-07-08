import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, inject, signal, computed } from '@angular/core';
import { PerfilUsuarioService } from '../../../../data-access/services/perfil-usuario.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CropModalComponent } from '../../../perfil-usuario/components/crop-modal/crop-modal.component';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tutor-header',
  templateUrl: './tutor-header.component.html',
  styleUrl: './tutor-header.component.css',
  imports: [CropModalComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorHeaderComponent {
  @Input({ required: true }) iniciales = '';
  @Input({ required: true }) nombreCompleto = '';
  @Input() urlFotoPerfil: string | null = null;
  @Input({ required: true }) cantidadHijos = 0;
  @Input({ required: true }) cantidadColegios = 0;
  @Input({ required: true }) saldoTotalFormateado = '';
  @Input() saldoTotalNegativo = false;

  private readonly perfilUsuarioService = inject(PerfilUsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly perfilService = inject(PerfilService);

  protected readonly esPremium = computed(() => {
    const plan = this.perfilService.perfil()?.plan;
    return plan === 'PREMIUM' || plan === 'AVANZADO';
  });

  protected readonly subiendoFoto = signal(false);
  protected readonly fotoEvent = signal<Event | null>(null);

  @ViewChild('inputFoto') private readonly inputFoto!: ElementRef<HTMLInputElement>;

  get resumenHijos(): string {
    const hijosLabel = this.cantidadHijos === 1 ? 'hijo' : 'hijos';
    if (this.cantidadColegios <= 1) {
      return `${this.cantidadHijos} ${hijosLabel}`;
    }
    return `${this.cantidadHijos} ${hijosLabel} · ${this.cantidadColegios} colegios`;
  }

  protected abrirSelectorFoto(): void {
    this.inputFoto.nativeElement.click();
  }

  protected async onFotoSeleccionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.toastService.mostrar('Solo se permiten imágenes JPG, PNG o WEBP.', 'error');
      input.value = '';
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.toastService.mostrar('La imagen no puede superar los 5 MB.', 'error');
      input.value = '';
      return;
    }

    this.fotoEvent.set(event);
  }

  protected async onFotoRecortada(blob: Blob): Promise<void> {
    const event = this.fotoEvent();
    if (!event) return;

    const input = event.target as HTMLInputElement;
    const originalFile = input.files?.[0];
    if (!originalFile) return;

    this.fotoEvent.set(null);
    this.subiendoFoto.set(true);

    try {
      const archivoRecortado = new File([blob], originalFile.name, { type: 'image/webp' });
      await this.perfilUsuarioService.subirFotoPerfil(archivoRecortado);
      this.toastService.mostrar('Foto de perfil actualizada.', 'success');
    } catch {
      this.toastService.mostrar('No se pudo subir la foto. Intentá de nuevo.', 'error');
    } finally {
      this.subiendoFoto.set(false);
      input.value = '';
    }
  }

  protected onCancelarRecorte(): void {
    const event = this.fotoEvent();
    if (event) {
      (event.target as HTMLInputElement).value = '';
    }
    this.fotoEvent.set(null);
  }
}
