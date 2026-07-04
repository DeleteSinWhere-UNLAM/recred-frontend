import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { SuppliersListPage } from './pages/suppliers-list/suppliers-list.page';
import { SupplierResponseMother } from './proveedores.mother';
import { SupplierService } from './services/supplier.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('SuppliersList Integration', () => {
  let fixture: ComponentFixture<SuppliersListPage>;
  let servicioSupplier: jasmine.SpyObj<SupplierService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: Router;

  const norte = SupplierResponseMother.crear({
    id: 'sup-1',
    nombre: 'Distribuidora Norte',
    diasVisita: 'Lunes',
  });
  const sur = SupplierResponseMother.crear({
    id: 'sup-2',
    nombre: 'Golosinas del Sur',
    diasVisita: 'Martes',
  });

  beforeEach(async () => {
    servicioSupplier = jasmine.createSpyObj('SupplierService', [
      'getSuppliers',
      'createSupplier',
      'updateSupplier',
      'deleteSupplier',
    ] as (keyof SupplierService)[]);
    servicioSupplier.getSuppliers.and.returnValue(of([norte, sur]));
    servicioSupplier.deleteSupplier.and.returnValue(of(void 0));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    const servicioUsuario = jasmine.createSpyObj('UsuarioService', [], {
      nombreNavbar: signal('Kiosquero Integration'),
    });

    await TestBed.configureTestingModule({
      imports: [SuppliersListPage],
      providers: [
        { provide: SupplierService, useValue: servicioSupplier },
        { provide: ToastService, useValue: servicioToast },
        { provide: UsuarioService, useValue: servicioUsuario },
        provideRouter([]),
      ],
    })
      .overrideComponent(SuppliersListPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(SuppliersListPage);
  });

  it('dado 2 proveedores del service, cuando se monta, deberia renderizar sus nombres en la lista', () => {
    fixture.detectChanges();

    const texto = textoRenderizado();
    expect(texto).toContain('Distribuidora Norte');
    expect(texto).toContain('Golosinas del Sur');
  });

  it('dado la lista cargada, cuando el kiosquero borra un proveedor confirmando el delete, deberia refetchear el listado', () => {
    fixture.detectChanges();

    fixture.componentInstance.openDeleteModal(norte, new Event('click'));
    fixture.componentInstance.confirmDelete();

    expect(servicioSupplier.deleteSupplier).toHaveBeenCalledWith('sup-1');
    expect(servicioSupplier.getSuppliers).toHaveBeenCalledTimes(2);
    expect(servicioToast.mostrar).toHaveBeenCalledWith(
      'Proveedor eliminado exitosamente',
      'success',
    );
  });

  it('dado la lista, cuando aplico busqueda, deberia dejar solo los proveedores que matchean', () => {
    fixture.detectChanges();

    fixture.componentInstance.onSearchChange('Norte');

    expect(fixture.componentInstance.filteredSuppliers().length).toBe(1);
    expect(fixture.componentInstance.filteredSuppliers()[0].id).toBe('sup-1');
  });

  it('dado la page montada, cuando el kiosquero toca volver al home, deberia navegar a /kiosquero', () => {
    fixture.detectChanges();

    fixture.componentInstance.volverHome();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
