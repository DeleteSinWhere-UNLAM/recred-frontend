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
    it('dado isOpen en false, cuando se renderiza, no deberia mostrar el modal', () => {
      givenModalAbierto(false);

      expect(queryUno('.confirm-delete__card')).toBeNull();
    });

    it('dado isOpen en true y un productName, cuando se renderiza, deberia mostrar el nombre en el mensaje', () => {
      givenModalAbierto(true);
      component.productName = 'Alfajor';
      fixture.detectChanges();

      const mensaje = queryUno('.confirm-delete__mensaje')?.textContent ?? '';
      expect(mensaje).toContain('Alfajor');
    });
  });

  describe('eventos', () => {
    it('dado el modal abierto, cuando hago click en Eliminar, deberia emitir confirmed', () => {
      givenModalAbierto(true);
      spyOn(component.confirmed, 'emit');

      whenHagoClickEn('.confirm-delete__btn--delete');

      expect(component.confirmed.emit).toHaveBeenCalled();
    });

    it('dado el modal abierto, cuando hago click en Cancelar, deberia emitir cancelled', () => {
      givenModalAbierto(true);
      spyOn(component.cancelled, 'emit');

      whenHagoClickEn('.confirm-delete__btn--cancel');

      expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('dado el modal abierto, cuando hago click en el overlay (backdrop), deberia emitir cancelled', () => {
      givenModalAbierto(true);
      spyOn(component.cancelled, 'emit');

      whenHagoClickEn('.confirm-delete__overlay');

      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });

  function givenModalAbierto(abierto: boolean): void {
    component.isOpen = abierto;
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    (queryUno(selector) as HTMLElement).click();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
