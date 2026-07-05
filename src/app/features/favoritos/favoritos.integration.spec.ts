import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ProductDTOMother, UUID_ALUMNO, UUID_PRODUCTO } from './favoritos.mother';
import { FavoritosPage } from './favoritos.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('Favoritos Integration', () => {
  const URL_LISTAR = `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos`;
  const URL_ELIMINAR = (productoId: string): string =>
    `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos/${productoId}`;

  let fixture: ComponentFixture<FavoritosPage>;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId', 'getPerfil']);
    servicioPerfil.obtenerAlumnoId.and.returnValue(UUID_ALUMNO);
    servicioPerfil.getPerfil.and.returnValue(null);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'getUsuarioActual',
      'getAlumnoActual',
      'setHomeUrl',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Alumno Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);
    servicioUsuario.getAlumnoActual.and.returnValue({
      id: 'fallback',
    } as ReturnType<UsuarioService['getAlumnoActual']>);

    servicioCarrito = jasmine.createSpyObj('CarritoService', ['agregar']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);

    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FavoritosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: ToastService, useValue: servicioToast },
      ],
    })
      .overrideComponent(FavoritosPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(FavoritosPage);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('dado un alumno con UUID, cuando se monta la page, deberia pedir favoritos al back y renderizar el nombre de cada uno', () => {
    whenMontoYElBackDevuelveFavoritos([ProductDTOMother.crear({ nombre: 'Alfajor Triple' })]);

    const nombre = queryUno('.favoritos-fav-card__nombre')?.textContent?.trim() ?? '';
    expect(nombre).toContain('Alfajor Triple');
  });

  it('dado un favorito cargado, cuando quito un favorito, deberia hacer DELETE al back y sacarlo de la lista', () => {
    whenMontoYElBackDevuelveFavoritos([ProductDTOMother.crear()]);

    fixture.componentInstance.quitarFavorito(UUID_PRODUCTO);

    const req = httpMock.expectOne(URL_ELIMINAR(UUID_PRODUCTO));
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(fixture.componentInstance.favoritos.length).toBe(0);
    expect(servicioToast.mostrar).toHaveBeenCalledWith('Producto quitado de favoritos', 'success');
  });

  it('dado que el back falla al listar favoritos y no hay nada en localStorage, cuando se monta la page, deberia mostrar lista vacia', () => {
    spyOn(console, 'warn');
    fixture.detectChanges();

    httpMock.expectOne(URL_LISTAR).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.favoritos).toEqual([]);
  });

  function whenMontoYElBackDevuelveFavoritos(favoritos: ReturnType<typeof ProductDTOMother.crear>[]): void {
    fixture.detectChanges();
    httpMock.expectOne(URL_LISTAR).flush(favoritos);
    fixture.detectChanges();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
