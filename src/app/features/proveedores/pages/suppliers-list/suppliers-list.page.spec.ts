import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { SUPPLIER_ID_TEST, SupplierResponseMother } from '../../proveedores.mother';
import { SupplierService } from '../../services/supplier.service';
import { SuppliersListPage } from './suppliers-list.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('SuppliersListPage', () => {
  let component: SuppliersListPage;
  let fixture: ComponentFixture<SuppliersListPage>;
  let servicioSupplier: jasmine.SpyObj<SupplierService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: Router;

  const proveedor1 = SupplierResponseMother.crear({
    id: 'sup-1',
    nombre: 'Distribuidora Norte',
    diasVisita: 'Lunes',
    notas: 'Pedidos con anticipacion',
  });
  const proveedor2 = SupplierResponseMother.crear({
    id: 'sup-2',
    nombre: 'Golosinas del Sur',
    diasVisita: 'Martes',
    notas: 'Solo efectivo',
  });

  beforeEach(async () => {
    servicioSupplier = jasmine.createSpyObj('SupplierService', [
      'getSuppliers',
      'getSupplierById',
      'createSupplier',
      'updateSupplier',
      'deleteSupplier',
      'uploadPriceList',
      'updateMapping',
      'getPurchaseRecommendations',
    ]);
    servicioSupplier.getSuppliers.and.returnValue(of([proveedor1, proveedor2]));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', [], {
      nombreNavbar: signal('Kiosquero Test'),
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
    spyOn(router, 'navigate');
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(SuppliersListPage);
    component = fixture.componentInstance;
  });

  describe('carga inicial', () => {
    it('dado la page recien montada, cuando se ejecuta ngOnInit, deberia llamar getSuppliers y poblar el listado', () => {
      whenMonto();

      expect(servicioSupplier.getSuppliers).toHaveBeenCalled();
      expect(component.suppliers().length).toBe(2);
      expect(component.filteredSuppliers().length).toBe(2);
      expect(component.isLoading()).toBeFalse();
    });

    it('dado que getSuppliers falla, cuando se monta, deberia mostrar toast de error y dejar isLoading en false', () => {
      spyOn(console, 'error');
      servicioSupplier.getSuppliers.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar la lista de proveedores',
        'error',
      );
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('busqueda', () => {
    beforeEach(() => whenMonto());

    it('dado una busqueda por nombre, deberia filtrar los proveedores por nombre (case insensitive)', () => {
      component.onSearchChange('DEL SUR');

      expect(component.filteredSuppliers().length).toBe(1);
      expect(component.filteredSuppliers()[0].id).toBe('sup-2');
    });

    it('dado una busqueda por dia de visita, deberia matchear en diasVisita', () => {
      component.onSearchChange('Martes');

      expect(component.filteredSuppliers().length).toBe(1);
      expect(component.filteredSuppliers()[0].id).toBe('sup-2');
    });

    it('dado una busqueda por texto de notas, deberia matchear en notas', () => {
      component.onSearchChange('efectivo');

      expect(component.filteredSuppliers().length).toBe(1);
      expect(component.filteredSuppliers()[0].id).toBe('sup-2');
    });

    it('dado una busqueda vacia, deberia devolver todos los proveedores', () => {
      component.onSearchChange('nada matchea');
      expect(component.filteredSuppliers().length).toBe(0);

      component.onSearchChange('');
      expect(component.filteredSuppliers().length).toBe(2);
    });
  });

  describe('modal de alta', () => {
    beforeEach(() => whenMonto());

    it('dado la lista, cuando abro el modal de alta, deberia limpiar el form y setear selectedSupplier en null', () => {
      component.openAddModal();

      expect(component.isFormModalOpen()).toBeTrue();
      expect(component.selectedSupplier()).toBeNull();
      expect(component.supplierForm.get('nombre')?.value).toBe('');
    });

    it('dado el form invalido, cuando guardo, no deberia llamar al service ni cerrar el modal', () => {
      component.openAddModal();
      component.supplierForm.patchValue({ nombre: '' });

      component.saveSupplier();

      expect(servicioSupplier.createSupplier).not.toHaveBeenCalled();
      expect(component.isFormModalOpen()).toBeTrue();
    });

    it('dado el form valido, cuando guardo un alta, deberia llamar a createSupplier, mostrar toast y recargar', () => {
      servicioSupplier.createSupplier.and.returnValue(of(SupplierResponseMother.crear({ id: 'sup-nuevo' })));
      component.openAddModal();
      component.supplierForm.patchValue({
        nombre: 'Nuevo Proveedor',
        telefono: '011-1234-5678',
        email: 'a@b.com',
        diasVisita: 'Viernes',
        notas: '',
      });

      component.saveSupplier();

      expect(servicioSupplier.createSupplier).toHaveBeenCalledWith({
        nombre: 'Nuevo Proveedor',
        telefono: '011-1234-5678',
        email: 'a@b.com',
        diasVisita: 'Viernes',
        notas: '',
      });
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Proveedor creado exitosamente',
        'success',
      );
      expect(servicioSupplier.getSuppliers).toHaveBeenCalledTimes(2);
      expect(component.isFormModalOpen()).toBeFalse();
    });

    it('dado que createSupplier falla, cuando guardo, deberia mostrar toast de error y no cerrar el modal', () => {
      spyOn(console, 'error');
      servicioSupplier.createSupplier.and.returnValue(throwError(() => new Error('boom')));
      component.openAddModal();
      component.supplierForm.patchValue({
        nombre: 'Nuevo',
        telefono: '',
        email: '',
        diasVisita: '',
        notas: '',
      });

      component.saveSupplier();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al registrar proveedor',
        'error',
      );
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('modal de edicion', () => {
    beforeEach(() => whenMonto());

    it('dado un proveedor, cuando abro el modal de edicion, deberia poblar el form con sus datos', () => {
      const evento = new Event('click');
      spyOn(evento, 'stopPropagation');

      component.openEditModal(proveedor1, evento);

      expect(evento.stopPropagation).toHaveBeenCalled();
      expect(component.isFormModalOpen()).toBeTrue();
      expect(component.selectedSupplier()?.id).toBe('sup-1');
      expect(component.supplierForm.get('nombre')?.value).toBe('Distribuidora Norte');
      expect(component.supplierForm.get('diasVisita')?.value).toBe('Lunes');
    });

    it('dado un proveedor seleccionado, cuando guardo, deberia llamar a updateSupplier con su id', () => {
      servicioSupplier.updateSupplier.and.returnValue(of(SupplierResponseMother.crear()));
      component.openEditModal(proveedor1, new Event('click'));
      component.supplierForm.patchValue({ nombre: 'Editado' });

      component.saveSupplier();

      expect(servicioSupplier.updateSupplier).toHaveBeenCalledWith(
        'sup-1',
        jasmine.objectContaining({ nombre: 'Editado' }),
      );
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Proveedor actualizado exitosamente',
        'success',
      );
    });

    it('dado que updateSupplier falla, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      servicioSupplier.updateSupplier.and.returnValue(throwError(() => new Error('boom')));
      component.openEditModal(proveedor1, new Event('click'));

      component.saveSupplier();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al actualizar proveedor',
        'error',
      );
    });
  });

  describe('modal de eliminacion', () => {
    beforeEach(() => whenMonto());

    it('dado un proveedor, cuando abro el modal de delete, deberia setear selectedSupplier y abrir el modal', () => {
      const evento = new Event('click');
      spyOn(evento, 'stopPropagation');

      component.openDeleteModal(proveedor1, evento);

      expect(evento.stopPropagation).toHaveBeenCalled();
      expect(component.isDeleteModalOpen()).toBeTrue();
      expect(component.selectedSupplier()?.id).toBe('sup-1');
    });

    it('dado sin proveedor seleccionado, cuando confirmo delete, no deberia llamar al service', () => {
      component.selectedSupplier.set(null);

      component.confirmDelete();

      expect(servicioSupplier.deleteSupplier).not.toHaveBeenCalled();
    });

    it('dado un proveedor seleccionado, cuando confirmo delete ok, deberia llamar al service y recargar', () => {
      servicioSupplier.deleteSupplier.and.returnValue(of(void 0));
      component.openDeleteModal(proveedor1, new Event('click'));

      component.confirmDelete();

      expect(servicioSupplier.deleteSupplier).toHaveBeenCalledWith('sup-1');
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Proveedor eliminado exitosamente',
        'success',
      );
      expect(component.isDeleteModalOpen()).toBeFalse();
    });

    it('dado que deleteSupplier falla, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      servicioSupplier.deleteSupplier.and.returnValue(throwError(() => new Error('boom')));
      component.openDeleteModal(proveedor1, new Event('click'));

      component.confirmDelete();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al eliminar proveedor',
        'error',
      );
    });
  });

  describe('navegacion', () => {
    beforeEach(() => whenMonto());

    it('dado un supplierId, cuando llamo verFicha, deberia navegar a /kiosquero/proveedores/{id}', () => {
      component.verFicha(SUPPLIER_ID_TEST);

      expect(router.navigate).toHaveBeenCalledWith(['/kiosquero/proveedores', SUPPLIER_ID_TEST]);
    });

    it('dado la page, cuando llamo volverHome, deberia navegar a /kiosquero', () => {
      component.volverHome();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });

    it('dado la page, cuando llamo irComparador, deberia navegar a /kiosquero/proveedores/comparador', () => {
      component.irComparador();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores/comparador');
    });
  });

  describe('close handlers', () => {
    beforeEach(() => whenMonto());

    it('dado el modal de form abierto, cuando cierro, deberia setearlo en false y limpiar selectedSupplier', () => {
      component.openEditModal(proveedor1, new Event('click'));

      component.closeFormModal();

      expect(component.isFormModalOpen()).toBeFalse();
      expect(component.selectedSupplier()).toBeNull();
    });

    it('dado el modal de delete abierto, cuando cierro, deberia setearlo en false y limpiar selectedSupplier', () => {
      component.openDeleteModal(proveedor1, new Event('click'));

      component.closeDeleteModal();

      expect(component.isDeleteModalOpen()).toBeFalse();
      expect(component.selectedSupplier()).toBeNull();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
