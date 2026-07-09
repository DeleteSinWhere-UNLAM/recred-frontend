import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarPromocionModalComponent } from './editar-promocion-modal.component';
import { PromotionWithProducts } from '../../presenter/promociones.presenter';

describe('EditarPromocionModalComponent', () => {
  let component: EditarPromocionModalComponent;
  let fixture: ComponentFixture<EditarPromocionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPromocionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarPromocionModalComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado isOpen en false, no deberia renderizar el overlay del modal', () => {
      component.isOpen = false;
      component.promotion = crearPromocion();
      fixture.detectChanges();

      expect(queryUno('.modal-overlay')).toBeNull();
    });

    it('dado isOpen en true y una promocion, deberia renderizar el overlay con el titulo de la promocion', () => {
      whenAbroConPromocion(crearPromocion({ name: 'Combo desayuno' }));

      expect(queryUno('.modal-overlay')).toBeTruthy();
      expect(textoRenderizado()).toContain('Combo desayuno');
    });

    it('dado una promocion con productos, deberia renderizar cada producto', () => {
      whenAbroConPromocion(
        crearPromocion({
          products: [
            crearProducto({ id: 'p-1', nombre: 'Tostado', precio: 1500 }),
            crearProducto({ id: 'p-2', nombre: 'Jugo', precio: 800 }),
          ],
        }),
      );

      const texto = textoRenderizado();
      expect(texto).toContain('Tostado');
      expect(texto).toContain('Jugo');
    });

    it('dado una promocion sin productos, deberia mostrar el mensaje "No hay productos"', () => {
      whenAbroConPromocion(crearPromocion({ products: [] }));

      expect(textoRenderizado()).toContain('No hay productos en esta promoción');
    });
  });

  describe('resetForm', () => {
    it('dado una promocion en el input, cuando reseteo, deberia poblar el formData con sus datos', () => {
      component.promotion = crearPromocion({
        name: 'Promo test',
        discountPercentage: 25,
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-06-30T23:59:59Z',
      });

      component.resetForm();

      expect(component.formData.name).toBe('Promo test');
      expect(component.formData.discountPercentage).toBe(25);
      expect(component.formData.startDate).toBe('2026-06-01');
      expect(component.formData.endDate).toBe('2026-06-30');
    });

    it('dado ngOnInit con una promocion, deberia poblar el formData', () => {
      component.promotion = crearPromocion({ name: 'Combo del dia', discountPercentage: 15 });

      component.ngOnInit();

      expect(component.formData.name).toBe('Combo del dia');
      expect(component.formData.discountPercentage).toBe(15);
    });

    it('dado ngOnChanges con isOpen true y promocion, deberia repoblar el formData', () => {
      component.promotion = crearPromocion({ name: 'Original' });
      component.isOpen = true;
      component.ngOnChanges();
      component.promotion = crearPromocion({ name: 'Actualizada' });

      component.ngOnChanges();

      expect(component.formData.name).toBe('Actualizada');
    });

    it('dado ngOnChanges con isOpen false, no deberia tocar el formData', () => {
      component.promotion = crearPromocion({ name: 'Original' });
      component.isOpen = true;
      component.ngOnChanges();
      component.isOpen = false;
      component.promotion = crearPromocion({ name: 'Otra' });

      component.ngOnChanges();

      expect(component.formData.name).toBe('Original');
    });
  });

  describe('formatDateForInput', () => {
    it('dado una fecha ISO, deberia devolver solo la parte YYYY-MM-DD', () => {
      expect(component.formatDateForInput('2026-07-15T10:30:00Z')).toBe('2026-07-15');
    });

    it('dado un string vacio, deberia devolver un string vacio', () => {
      expect(component.formatDateForInput('')).toBe('');
    });
  });

  describe('formatDateForServer', () => {
    it('dado una fecha YYYY-MM-DD y isEnd false, deberia devolver un ISO a medianoche local', () => {
      const salida = component.formatDateForServer('2026-07-15', false);
      const fecha = new Date(salida);

      expect(fecha.getFullYear()).toBe(2026);
      expect(fecha.getMonth()).toBe(6);
      expect(fecha.getDate()).toBe(15);
      expect(fecha.getHours()).toBe(0);
      expect(fecha.getMinutes()).toBe(0);
    });

    it('dado una fecha YYYY-MM-DD y isEnd true, deberia devolver un ISO al final del dia local', () => {
      const salida = component.formatDateForServer('2026-07-15', true);
      const fecha = new Date(salida);

      expect(fecha.getFullYear()).toBe(2026);
      expect(fecha.getMonth()).toBe(6);
      expect(fecha.getDate()).toBe(15);
      expect(fecha.getHours()).toBe(23);
      expect(fecha.getMinutes()).toBe(59);
    });

    it('dado un string vacio, deberia devolver un string vacio', () => {
      expect(component.formatDateForServer('', false)).toBe('');
    });
  });

  describe('closeModal', () => {
    it('cuando cierro el modal, deberia emitir closeModalEvent', () => {
      const spy = jasmine.createSpy('closeModalEvent');
      component.closeModalEvent.subscribe(spy);

      component.closeModal();

      expect(spy).toHaveBeenCalled();
    });

    it('cuando hago click en el boton cerrar, deberia emitir closeModalEvent', () => {
      whenAbroConPromocion(crearPromocion());
      const spy = jasmine.createSpy('closeModalEvent');
      component.closeModalEvent.subscribe(spy);

      (queryUno('.close-btn') as HTMLButtonElement).click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('saveChanges', () => {
    it('dado un formData valido, deberia emitir save con la promocion normalizada', () => {
      component.promotion = crearPromocion({ id: 'promo-1', productIds: ['p-1', 'p-2'] });
      component.formData = {
        name: 'Nuevo nombre',
        discountPercentage: 30,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };
      const spy = jasmine.createSpy('save');
      component.save.subscribe(spy);

      component.saveChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      const payload = spy.calls.mostRecent().args[0];
      expect(payload.id).toBe('promo-1');
      expect(payload.name).toBe('Nuevo nombre');
      expect(payload.discountPercentage).toBe(30);
      expect(payload.productIds).toEqual(['p-1', 'p-2']);
      const inicio = new Date(payload.startDate);
      expect(inicio.getDate()).toBe(1);
      expect(inicio.getMonth()).toBe(7);
      const fin = new Date(payload.endDate);
      expect(fin.getDate()).toBe(31);
      expect(fin.getMonth()).toBe(7);
      expect(fin.getHours()).toBe(23);
    });

    it('dado un formData sin nombre, no deberia emitir save', () => {
      component.promotion = crearPromocion();
      component.formData = { name: '', discountPercentage: 10, startDate: '2026-08-01', endDate: '2026-08-31' };
      const spy = jasmine.createSpy('save');
      component.save.subscribe(spy);

      component.saveChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('dado un formData sin fecha de inicio, no deberia emitir save', () => {
      component.promotion = crearPromocion();
      component.formData = { name: 'Nombre', discountPercentage: 10, startDate: '', endDate: '2026-08-31' };
      const spy = jasmine.createSpy('save');
      component.save.subscribe(spy);

      component.saveChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('dado un formData sin fecha de fin, no deberia emitir save', () => {
      component.promotion = crearPromocion();
      component.formData = { name: 'Nombre', discountPercentage: 10, startDate: '2026-08-01', endDate: '' };
      const spy = jasmine.createSpy('save');
      component.save.subscribe(spy);

      component.saveChanges();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  function whenAbroConPromocion(promotion: PromotionWithProducts): void {
    component.promotion = promotion;
    component.isOpen = true;
    component.ngOnChanges();
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  function crearPromocion(override: Partial<PromotionWithProducts> = {}): PromotionWithProducts {
    return {
      id: 'promo-1',
      name: 'Promo default',
      discountPercentage: 10,
      productIds: [],
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      status: 'ACTIVE',
      imageUrl: undefined,
      products: [],
      ...override,
    };
  }

  function crearProducto(override: Partial<PromotionWithProducts['products'][number]> = {}): PromotionWithProducts['products'][number] {
    return {
      id: 'prod-1',
      nombre: 'Producto default',
      descripcion: '',
      precio: 1000,
      peso: 0,
      requierePreparacion: false,
      stockActual: 10,
      ...override,
    };
  }
});
