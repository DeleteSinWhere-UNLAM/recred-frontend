import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../../features/compra/data/carrito.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly carritoService = inject(CarritoService);

  @Input() userName = '';

  protected readonly cartCount = this.carritoService.cantidadTotal;

  protected irAlCarrito(): void {
    this.router.navigateByUrl('/compra');
  }

  protected irAInicio(event: Event): void {
    event.preventDefault();
    this.router.navigateByUrl('/');
  }
}
