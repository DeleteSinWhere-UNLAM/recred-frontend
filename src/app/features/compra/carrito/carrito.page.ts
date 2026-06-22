import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { OrdenAlumnoCardComponent } from '../components/orden-alumno-card/orden-alumno-card.component';
import {
  ResumenLinea,
  ResumenOrdenCardComponent,
} from '../components/resumen-orden-card/resumen-orden-card.component';
import { SugerenciasCarritoComponent } from '../components/sugerencias-carrito/sugerencias-carrito.component';
import { CarritoPresenter } from './presenter/carrito.presenter';
import { GuardarFavoritoModalComponent } from '../components/guardar-favorito-modal/guardar-favorito-modal.component';
import { ItemCarrito } from '../models/carrito.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { CarritosFavoritosService } from '../../carritos-favoritos/services/carritos-favoritos.service';

@Component({
  selector: 'app-carrito-page',
  templateUrl: './carrito.page.html',
  styleUrl: './carrito.page.css',
  imports: [
    NavbarComponent,
    OrdenAlumnoCardComponent,
    ResumenOrdenCardComponent,
    SugerenciasCarritoComponent,
    GuardarFavoritoModalComponent,
  ],
  providers: [CarritoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarritoPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(CarritoPresenter);
  private readonly perfilService = inject(PerfilService);
  private readonly carritosFavoritosService = inject(CarritosFavoritosService);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;

  cantCarritos = signal(0);
  readonly esPlanGratuito = computed(() => this.perfilService.perfil()?.plan !== 'PREMIUM');
  readonly esPremium = computed(() => this.perfilService.perfil()?.plan === 'PREMIUM');
  readonly limiteCarritosAlcanzado = computed(() => this.esPlanGratuito() && this.cantCarritos() >= 3);

  mostrarModalFavorito = false;
  favoritoModalAlumnoId = '';
  favoritoModalItems: { productId: string; productName: string; price: number; quantity: number }[] = [];

  ngOnInit(): void {
    this.presenter.init();
    this.carritosFavoritosService.getCarritosFavoritos().subscribe({
      next: (carts) => this.cantCarritos.set(carts.length),
      error: (err) => console.error('Error al cargar carritos favoritos en CarritoPage:', err)
    });
  }

  protected readonly lineasResumen = computed<ResumenLinea[]>(() =>
    this.presenter.grupos().map((g) => ({
      alumnoId: g.alumno.id,
      nombre: this.esVistaAlumno() ? `${g.alumno.nombre} ${g.alumno.apellido}` : g.alumno.nombre,
      subtotal: g.subtotal,
      incluido: g.seleccionado,
    })),
  );

  abrirModalFavorito(alumnoId: string, items: ItemCarrito[]): void {
    this.favoritoModalAlumnoId = alumnoId;
    this.favoritoModalItems = items.map((i) => ({
      productId: i.producto.id,
      productName: i.producto.nombre,
      price: i.producto.precio,
      quantity: i.cantidad,
    }));
    this.mostrarModalFavorito = true;
  }

  cerrarModalFavorito(): void {
    this.mostrarModalFavorito = false;
    this.favoritoModalAlumnoId = '';
    this.favoritoModalItems = [];
  }
}
