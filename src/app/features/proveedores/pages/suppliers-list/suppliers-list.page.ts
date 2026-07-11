import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { SupplierResponse, SupplierRequest } from '../../models/proveedores.interfaces';
import { ToastService } from '../../../../shared/services/toast.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../../data-access/services/usuario.service';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './suppliers-list.page.html',
  styleUrl: './suppliers-list.page.css'
})
export class SuppliersListPage implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreKiosquero = this.usuarioService.nombreNavbar;


  suppliers = signal<SupplierResponse[]>([]);
  filteredSuppliers = signal<SupplierResponse[]>([]);
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);


  readonly isCompararDisabled = computed(() => {
    const list = this.suppliers();
    if (list.length === 0) {
      return true;
    }
    return !list.some(supplier =>
      supplier.listasPrecios && supplier.listasPrecios.length > 0
    );
  });


  isFormModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);
  selectedSupplier = signal<SupplierResponse | null>(null);


  supplierForm!: FormGroup;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  private initForm(): void {
    this.supplierForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      email: ['', [Validators.email]],
      diasVisita: [''],
      notas: ['']
    });
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers', err);
        this.toastService.mostrar('Error al cargar la lista de proveedores', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.applyFilter();
  }

  applyFilter(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredSuppliers.set(this.suppliers());
      return;
    }

    const filtered = this.suppliers().filter(supplier =>
      supplier.nombre.toLowerCase().includes(query) ||
      supplier.diasVisita.toLowerCase().includes(query) ||
      supplier.notas.toLowerCase().includes(query)
    );
    this.filteredSuppliers.set(filtered);
  }

  openAddModal(): void {
    this.selectedSupplier.set(null);
    this.supplierForm.reset({
      nombre: '',
      telefono: '',
      email: '',
      diasVisita: '',
      notas: ''
    });
    this.isFormModalOpen.set(true);
  }

  openEditModal(supplier: SupplierResponse, event: Event): void {
    event.stopPropagation();
    this.selectedSupplier.set(supplier);
    this.supplierForm.patchValue({
      nombre: supplier.nombre,
      telefono: supplier.telefono || '',
      email: supplier.email || '',
      diasVisita: supplier.diasVisita || '',
      notas: supplier.notas || ''
    });
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedSupplier.set(null);
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const payload: SupplierRequest = this.supplierForm.value;
    const selected = this.selectedSupplier();

    this.isLoading.set(true);

    if (selected) {

      this.supplierService.updateSupplier(selected.id, payload).subscribe({
        next: () => {
          this.toastService.mostrar('Proveedor actualizado exitosamente', 'success');
          this.loadSuppliers();
          this.closeFormModal();
        },
        error: (err) => {
          console.error('Error updating supplier', err);
          this.toastService.mostrar('Error al actualizar proveedor', 'error');
          this.isLoading.set(false);
        }
      });
    } else {

      this.supplierService.createSupplier(payload).subscribe({
        next: () => {
          this.toastService.mostrar('Proveedor creado exitosamente', 'success');
          this.loadSuppliers();
          this.closeFormModal();
        },
        error: (err) => {
          console.error('Error creating supplier', err);
          this.toastService.mostrar('Error al registrar proveedor', 'error');
          this.isLoading.set(false);
        }
      });
    }
  }

  openDeleteModal(supplier: SupplierResponse, event: Event): void {
    event.stopPropagation();
    this.selectedSupplier.set(supplier);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedSupplier.set(null);
  }

  confirmDelete(): void {
    const selected = this.selectedSupplier();
    if (!selected) return;

    this.isLoading.set(true);
    this.supplierService.deleteSupplier(selected.id).subscribe({
      next: () => {
        this.toastService.mostrar('Proveedor eliminado exitosamente', 'success');
        this.loadSuppliers();
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error deleting supplier', err);
        this.toastService.mostrar('Error al eliminar proveedor', 'error');
        this.isLoading.set(false);
      }
    });
  }

  verFicha(supplierId: string): void {
    this.router.navigate(['/kiosquero/proveedores', supplierId]);
  }

  volverHome(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  irComparador(): void {
    if (this.isCompararDisabled()) return;
    this.router.navigateByUrl('/kiosquero/proveedores/comparador');
  }
}
