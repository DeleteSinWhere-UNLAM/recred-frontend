import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoDashboardComponent } from './directivo-dashboard.component';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

describe('DirectivoDashboardComponent', () => {
  let component: DirectivoDashboardComponent;
  let fixture: ComponentFixture<DirectivoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectivoDashboardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DirectivoDashboardComponent);
    component = fixture.componentInstance;
  });

  it('dado el componente, cuando se monta, deberia crearse', () => {
    whenMonto();
    expect(component).toBeTruthy();
  });

  it('debería renderizar mensaje de carga cuando loading es true', () => {
    component.loading = true;
    fixture.detectChanges();
    const loadingEl = fixture.debugElement.query(By.css('.pv__notice[role="status"]'));
    expect(loadingEl).toBeTruthy();
  });

  it('debería renderizar error cuando hay un mensaje de error', () => {
    component.error = 'Error fatal';
    fixture.detectChanges();
    const errorEl = fixture.debugElement.query(By.css('.pv__notice--error'));
    expect(errorEl.nativeElement.textContent).toContain('Error fatal');
  });

  it('debería renderizar el colegio y buffets', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      licencia: {
        estado: 'ACTIVA',
        fechaVencimiento: '2026-08-05T22:48:39',
        monto: 20,
        moneda: 'USD',
      },
      buffets: [
        {
          id: 'b1',
          nombre: 'Kiosco 1',
          activo: true,
          vendedor: { id: 'v1', nombre: 'Juan', apellido: 'Perez', email: 'j@j.com', cuit: '20' }
        }
      ]
    };
    fixture.detectChanges();
    
    const h1 = fixture.debugElement.query(By.css('#pv-title')).nativeElement;
    expect(h1.textContent).toContain('Colegio Test');
    
    const card = fixture.debugElement.query(By.css('.pv__operation-card'));
    expect(card).toBeTruthy();
    expect(card.nativeElement.textContent).toContain('Kiosco 1');
  });



  it('dado un colegio sin kioscos, deberia mostrar el boton para crear kiosco', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      buffets: [],
    };
    fixture.detectChanges();

    const botonCrearKiosco = fixture.debugElement.query(By.css('.pv__primary-action'));

    expect(botonCrearKiosco).toBeTruthy();
    expect(botonCrearKiosco.nativeElement.textContent).toContain('Nuevo kiosco');
  });

  it('dado un colegio con kiosco cargado, no deberia mostrar el boton para crear kiosco', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      buffets: [
        {
          id: 'b1',
          nombre: 'Kiosco 1',
          activo: true,
          vendedor: null,
        },
      ],
    };
    fixture.detectChanges();

    const botonCrearKiosco = fixture.debugElement.query(By.css('.pv__primary-action'));

    expect(botonCrearKiosco).toBeNull();
  });


  describe('modal de vendedor', () => {
    const vendedorX = { id: 'v1', nombre: 'Juan', apellido: 'Perez', email: 'j@j.com', cuit: '20-000' };
    const buffetX = { id: 'b1', nombre: 'Kiosco', activo: true, vendedor: vendedorX };

    it('dado un vendedor, cuando lo abro, deberia setear vendedorSeleccionado', () => {
      component.verDetalleVendedor(vendedorX, buffetX);

      expect(component.vendedorSeleccionado()).toEqual(vendedorX);
      expect(component.buffetSeleccionado()).toEqual(buffetX);
    });

    it('dado el modal abierto, cuando cierro, deberia limpiar vendedorSeleccionado', () => {
      component.verDetalleVendedor(vendedorX, buffetX);

      component.cerrarModal();

      expect(component.vendedorSeleccionado()).toBeNull();
      expect(component.buffetSeleccionado()).toBeNull();
    });
  });

  describe('buffetsConVendedor y buffetsSinVendedor', () => {
    it('dado sin data, ambos contadores deberian ser 0', () => {
      component.data = null;

      expect(component.buffetsConVendedor()).toBe(0);
      expect(component.buffetsSinVendedor()).toBe(0);
    });

    it('dado buffets con y sin vendedor, deberia contarlos por separado', () => {
      component.data = {
        id: '1', nombre: 'X', cue: 'c',
        buffets: [
          { id: 'b1', nombre: 'K1', activo: true, vendedor: { id: 'v', nombre: 'A', apellido: 'B', email: 'e', cuit: 'c' } },
          { id: 'b2', nombre: 'K2', activo: true, vendedor: null },
          { id: 'b3', nombre: 'K3', activo: true, vendedor: null },
        ],
      };

      expect(component.buffetsConVendedor()).toBe(1);
      expect(component.buffetsSinVendedor()).toBe(2);
    });
  });


  function whenMonto(): void {
    fixture.detectChanges();
  }
});
