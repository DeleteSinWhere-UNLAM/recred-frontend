import { Component, EventEmitter, Input, Output, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { CarritosFavoritosService } from '../../../carritos-favoritos/services/carritos-favoritos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { SaveCarritoFavoritoRequest } from '../../../carritos-favoritos/models/carritos-favoritos.model';

@Component({
  selector: 'app-guardar-favorito-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guardar-favorito-modal.component.html',
  styleUrl: './guardar-favorito-modal.component.css'
})
export class GuardarFavoritoModalComponent implements OnInit {
  private readonly alumnosService = inject(AlumnosService);
  private readonly carritosFavoritosService = inject(CarritosFavoritosService);
  private readonly toastService = inject(ToastService);
  private readonly usuarioService = inject(UsuarioService);

  readonly esVistaAlumno = this.usuarioService.esVistaAlumno;

  @Input() cartId: string | null = null;
  @Input() initialNombre = '';
  @Input() initialAlumnoId = '';
  @Input() items: { productId: string; productName: string; price: number; quantity: number }[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  nombre = '';
  alumnoId = '';
  isSaving = false;

  readonly hijos = this.alumnosService.alumnos;

  constructor() {
    // React to changes in initial values
    effect(() => {
      this.nombre = this.initialNombre;
      this.alumnoId = this.initialAlumnoId;
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.nombre = this.initialNombre;
    this.alumnoId = this.initialAlumnoId;
    void this.alumnosService.asegurarCargados();
  }

  get total(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  onSave(): void {
    if (!this.nombre.trim()) {
      this.toastService.mostrar('Por favor, ingresá un nombre para el carrito', 'error');
      return;
    }
    if (!this.alumnoId) {
      this.toastService.mostrar('Por favor, seleccioná un hijo', 'error');
      return;
    }
    if (this.items.length === 0) {
      this.toastService.mostrar('No hay productos en el carrito para guardar', 'error');
      return;
    }

    this.isSaving = true;
    const request: SaveCarritoFavoritoRequest = {
      id: this.cartId,
      nombre: this.nombre.trim(),
      alumnoId: this.alumnoId,
      items: this.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.carritosFavoritosService.saveCarritoFavorito(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.mostrar(
          this.cartId ? 'Carrito favorito actualizado con éxito' : 'Carrito guardado como favorito con éxito',
          'success'
        );
        this.saveSuccess.emit();
        this.closeModal.emit();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al guardar el carrito favorito:', error);
        this.toastService.mostrar('Hubo un error al guardar el carrito favorito', 'error');
      }
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
