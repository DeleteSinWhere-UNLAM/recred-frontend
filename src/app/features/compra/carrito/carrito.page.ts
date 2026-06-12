import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
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

  readonly nombreUsuario = this.usuarioService.nombreNavbar;

  mostrarModalFavorito = false;
  favoritoModalAlumnoId = '';
  favoritoModalItems: { productId: string; productName: string; price: number; quantity: number }[] = [];

  ngOnInit(): void {
    this.presenter.init();
  }

  protected readonly lineasResumen = computed<ResumenLinea[]>(() =>
    this.presenter.grupos().map((g) => ({
      alumnoId: g.alumno.id,
      nombre: `${g.alumno.nombre} ${g.alumno.apellido}`,
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
