import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritosFavoritosService } from './services/carritos-favoritos.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ToastService } from '../../shared/services/toast.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { CarritoFavoritoResponse } from './models/carritos-favoritos.model';
import { Producto } from '../buffet/models/producto.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { GuardarFavoritoModalComponent } from '../compra/components/guardar-favorito-modal/guardar-favorito-modal.component';
import { DialogService } from '../../shared/services/dialog.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';

interface GrupoHijo {
  alumnoId: string;
  alumnoNombre: string;
  alumnoApellido: string;
  urlFotoPerfil: string | null;
  carritos: CarritoFavoritoResponse[];
}

@Component({
  selector: 'app-carritos-favoritos-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, GuardarFavoritoModalComponent],
  templateUrl: './carritos-favoritos.page.html',
  styleUrl: './carritos-favoritos.page.css'
})
export class CarritosFavoritosPage implements OnInit {
  private readonly carritosService = inject(CarritosFavoritosService);
  private readonly carritoService = inject(CarritoService);
  private readonly toastService = inject(ToastService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly perfilService = inject(PerfilService);
  private readonly alumnosService = inject(AlumnosService);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;
  readonly esPlanGratuito = this.perfilService.esPlanGratuito;
  readonly esPremium = computed(() => !this.esPlanGratuito());

  readonly hijosColapsados = signal<Record<string, boolean>>({});

  toggleGrupoHijo(alumnoId: string): void {
    const current = this.hijosColapsados();
    this.hijosColapsados.set({
      ...current,
      [alumnoId]: !current[alumnoId]
    });
  }

  isGrupoHijoExpanded(alumnoId: string): boolean {
    return this.hijosColapsados()[alumnoId] !== true;
  }

  carritosFavoritos: CarritoFavoritoResponse[] = [];
  readonly gruposHijos = signal<GrupoHijo[]>([]);
  readonly todosHijosColapsados = computed(() => {
    const hijos = this.gruposHijos();
    const colapsados = this.hijosColapsados();
    if (hijos.length === 0) return false;
    return hijos.every(h => colapsados[h.alumnoId] === true);
  });
  isLoading = false;

  mostrarModalEditar = false;
  editarCartId: string | null = null;
  editarInitialNombre = '';
  editarInitialAlumnoId = '';
  editarItems: { productId: string; productName: string; price: number; quantity: number }[] = [];

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');
  }

  ngOnInit(): void {
    this.alumnosService.asegurarCargados()
      .then(() => {
        this.cargarCarritosFavoritos();
      })
      .catch((err) => {
        console.error('Error al asegurar cargados alumnos:', err);
        this.cargarCarritosFavoritos();
      });
  }

  cargarCarritosFavoritos(): void {
    this.isLoading = true;
    this.carritosService.getCarritosFavoritos().subscribe({
      next: (data) => {
        this.carritosFavoritos = data;
        this.isLoading = false;
        this.agruparCarritosPorHijo();
      },
      error: (err) => {
        console.error('Error al cargar carritos favoritos:', err);
        this.isLoading = false;
        this.toastService.mostrar('Error al cargar los carritos favoritos', 'error');
      }
    });
  }

  agruparCarritosPorHijo(): void {
    const mapa = new Map<string, { alumnoNombre: string; alumnoApellido: string; urlFotoPerfil: string | null; carritos: CarritoFavoritoResponse[] }>();
    for (const c of this.carritosFavoritos) {
      const key = c.alumnoId;
      const alumno = this.alumnosService.getAlumnoById(key);
      const urlFotoPerfil = alumno?.urlFotoPerfil ?? null;
      
      const grupo = mapa.get(key) ?? { 
        alumnoNombre: c.alumnoNombre, 
        alumnoApellido: c.alumnoApellido, 
        urlFotoPerfil,
        carritos: [] 
      };
      grupo.carritos.push(c);
      mapa.set(key, grupo);
    }
    this.gruposHijos.set(Array.from(mapa.entries()).map(([alumnoId, data]) => ({
      alumnoId,
      alumnoNombre: data.alumnoNombre,
      alumnoApellido: data.alumnoApellido,
      urlFotoPerfil: data.urlFotoPerfil,
      carritos: data.carritos
    })));
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  cargarAlCarrito(carrito: CarritoFavoritoResponse): void {
    for (const item of carrito.items) {
      const producto: Producto = {
        id: item.productId,
        nombre: item.productName,
        descripcion: '',
        precio: item.unitPrice,
        categoria: { id: 'comidas', descripcion: 'Comidas' },
        clasificacionesSalud: [],
        imagen: '',
        estadoStock: 'DISPONIBLE'
      };
      this.carritoService.agregar(producto, carrito.alumnoId, item.quantity);
    }
    this.toastService.mostrar(`Se cargaron los productos del carrito "${carrito.nombre}" al carrito de compras`, 'success');
  }

  async eliminarCarrito(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm('¿Estás seguro de que querés eliminar este carrito favorito?', 'Eliminar Carrito');
    if (confirmed) {
      this.carritosService.deleteCarritoFavorito(id).subscribe({
        next: () => {
          this.toastService.mostrar('Carrito favorito eliminado', 'success');
          this.cargarCarritosFavoritos();
        },
        error: (err) => {
          console.error('Error al eliminar carrito:', err);
          this.toastService.mostrar('Error al eliminar el carrito favorito', 'error');
        }
      });
    }
  }

  abrirEditarModal(carrito: CarritoFavoritoResponse): void {
    this.editarCartId = carrito.id;
    this.editarInitialNombre = carrito.nombre;
    this.editarInitialAlumnoId = carrito.alumnoId;
    this.editarItems = carrito.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      price: item.unitPrice,
      quantity: item.quantity
    }));
    this.mostrarModalEditar = true;
  }

  cerrarEditarModal(): void {
    this.mostrarModalEditar = false;
    this.editarCartId = null;
    this.editarInitialNombre = '';
    this.editarInitialAlumnoId = '';
    this.editarItems = [];
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(precio);
  }
}
