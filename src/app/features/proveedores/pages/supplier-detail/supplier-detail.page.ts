import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { SupplierResponse, ListaPrecioProveedorResponse } from '../../models/proveedores.interfaces';
import { ToastService } from '../../../../shared/services/toast.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [NavbarComponent, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './supplier-detail.page.html',
  styleUrl: './supplier-detail.page.css'
})
export class SupplierDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supplierService = inject(SupplierService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreKiosquero = this.usuarioService.nombreNavbar;


  supplierId = '';
  supplier = signal<SupplierResponse | null>(null);
  isLoading = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  isDragOver = signal<boolean>(false);
  isPricesModalOpen = signal<boolean>(false);
  pricesSearchQuery = signal<string>('');

  ocultasTemporalmente = signal<string[]>([]);
  eliminadasDefinitivamente = signal<string[]>([]);

  ngOnInit(): void {
    const saved = localStorage.getItem('recred_eliminadas_listas_precio');
    if (saved) {
      try {
        this.eliminadasDefinitivamente.set(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing deleted lists from localStorage', e);
      }
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.supplierId = id;
        this.loadSupplier();
      } else {
        this.toastService.mostrar('Proveedor no especificado', 'error');
        this.volver();
      }
    });
  }

  loadSupplier(): void {
    this.isLoading.set(true);
    this.supplierService.getSupplierById(this.supplierId).subscribe({
      next: (data) => {
        this.supplier.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading supplier', err);
        this.toastService.mostrar('Error al cargar la ficha del proveedor', 'error');
        this.isLoading.set(false);
        this.volver();
      }
    });
  }


  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {

    const allowedExtensions = ['pdf', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      this.toastService.mostrar('Formato de archivo inválido. Solo se admiten archivos .PDF o .CSV.', 'error');
      return;
    }


    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.toastService.mostrar('El archivo supera el límite de 5MB.', 'error');
      return;
    }


    this.uploadPriceList(file);
  }

  private uploadPriceList(file: File): void {
    this.isUploading.set(true);
    this.supplierService.uploadPriceList(this.supplierId, file).subscribe({
      next: (priceList) => {
        this.isUploading.set(false);
        this.toastService.mostrar('Lista de precios subida y procesada correctamente con IA', 'success');
        this.loadSupplier();

        this.router.navigate(['/kiosquero/proveedores/lista-precio', priceList.id]);
      },
      error: (err) => {
        console.error('Error uploading price list', err);
        this.toastService.mostrar('Error al procesar el archivo. Reintentá en unos instantes.', 'error');
        this.isUploading.set(false);
      }
    });
  }

  verMapeo(listaPrecioId: string): void {
    this.router.navigate(['/kiosquero/proveedores/lista-precio', listaPrecioId]);
  }

  descargarArchivo(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, '_blank');
  }

  isListMapped(list: ListaPrecioProveedorResponse): boolean {
    return !!list.items && list.items.length > 0 && list.items.every(item => item.mappingConfirmado);
  }

  ocultarTemporalmente(id: string, event: Event): void {
    event.stopPropagation();
    this.ocultasTemporalmente.update(ids => [...ids, id]);
    this.toastService.mostrar('Lista ocultada temporalmente', 'success');
  }

  eliminarDefinitivamente(id: string, event: Event): void {
    event.stopPropagation();
    const saved = localStorage.getItem('recred_eliminadas_listas_precio');
    const ids: string[] = saved ? JSON.parse(saved) : [];
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem('recred_eliminadas_listas_precio', JSON.stringify(ids));
    }
    this.eliminadasDefinitivamente.update(current => [...current, id]);
    this.toastService.mostrar('Lista eliminada de la vista', 'success');
  }

  getListasPreciosFiltradas(): ListaPrecioProveedorResponse[] {
    const data = this.supplier();
    if (!data || !data.listasPrecios) return [];

    const ocultas = this.ocultasTemporalmente();
    const eliminadas = this.eliminadasDefinitivamente();

    return data.listasPrecios.filter(
      list => !ocultas.includes(list.id) && !eliminadas.includes(list.id)
    );
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero/proveedores');
  }

  openPricesModal(): void {
    this.isPricesModalOpen.set(true);
    this.pricesSearchQuery.set('');
  }

  closePricesModal(): void {
    this.isPricesModalOpen.set(false);
  }

  getLatestPrices(): PrecioProducto[] {
    const data = this.supplier();
    if (!data || !data.listasPrecios) return [];

    const sortedLists = [...data.listasPrecios].sort(
      (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime()
    );

    const latestMap = new Map<string, { precio: number; fecha: string; unidad: string; lista: string }>();

    for (const list of sortedLists) {
      if (!list.items) continue;
      for (const item of list.items) {
        latestMap.set(item.nombreProductoProveedor, {
          precio: item.precio,
          fecha: list.creadoEn,
          unidad: item.unidad || 'unidad',
          lista: list.nombreOriginal
        });
      }
    }

    const query = this.pricesSearchQuery().toLowerCase().trim();
    const result = Array.from(latestMap.entries()).map(([name, details]) => ({
      nombre: name,
      ...details
    }));

    if (!query) {
      return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return result
      .filter(p => p.nombre.toLowerCase().includes(query))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
}

export interface PrecioProducto {
  nombre: string;
  precio: number;
  fecha: string;
  unidad: string;
  lista: string;
}
