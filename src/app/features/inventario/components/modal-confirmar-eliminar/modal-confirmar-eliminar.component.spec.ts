import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalConfirmarEliminarComponent } from './modal-confirmar-eliminar.component';

describe('ModalConfirmarEliminarComponent', () => {
  let component: ModalConfirmarEliminarComponent;
  let fixture: ComponentFixture<ModalConfirmarEliminarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmarEliminarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalConfirmarEliminarComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado isOpen en false, no deberia renderizar el modal', () => {
      component.isOpen = false;
      fixture.detectChanges();

      expect(queryUno('.confirm-delete__card')).toBeNull();
    });

    it('dado isOpen en true y un productName, deberia renderizar el nombre en el mensaje', () => {
      component.isOpen = true;
      component.productName = 'Alfajor';
      fixture.detectChanges();

      const mensaje = queryUno('.confirm-delete__mensaje')?.textContent ?? '';
      expect(mensaje).toContain('Alfajor');
    });
  });

  describe('eventos', () => {
    it('dado el modal abierto, cuando hago click en Eliminar, deberia emitir confirmed', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component.confirmed, 'emit');

      (queryUno('.confirm-delete__btn--delete') as HTMLButtonElement).click();

      expect(component.confirmed.emit).toHaveBeenCalled();
    });

    it('dado el modal abierto, cuando hago click en Cancelar, deberia emitir cancelled', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component.cancelled, 'emit');

      (queryUno('.confirm-delete__btn--cancel') as HTMLButtonElement).click();

      expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('dado el modal abierto, cuando hago click en el overlay (backdrop), deberia emitir cancelled', () => {
      component.isOpen = true;
      fixture.detectChanges();
      spyOn(component.cancelled, 'emit');

      (queryUno('.confirm-delete__overlay') as HTMLElement).click();

      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
