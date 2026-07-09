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

  it('dado licencia activa, deberia mostrar monto y vigencia', () => {
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
      buffets: [],
    };
    fixture.detectChanges();

    const licencia = fixture.debugElement.query(By.css('.pv__license-card')).nativeElement as HTMLElement;
    expect(licencia.textContent).toContain('Licencia colegio');
    expect(licencia.textContent).toContain('USD 20 / mes');
    expect(licencia.textContent).toContain('05/08/2026');
  });

  it('dado estado SIN_LICENCIA, deberia mostrar Sin licencia', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      estadoLicencia: 'SIN_LICENCIA',
      buffets: [],
    };
    fixture.detectChanges();

    const licencia = fixture.debugElement.query(By.css('.pv__license-card')).nativeElement as HTMLElement;
    expect(licencia.textContent).toContain('Sin licencia');
    expect(licencia.textContent).not.toContain('SIN_LICENCIA');
  });

  it('dado click en pagar licencia, deberia emitir el evento', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      buffets: [],
    };
    const spy = spyOn(component.pagarLicencia, 'emit');
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('.pv__license-button')).nativeElement as HTMLButtonElement;
    boton.click();

    expect(spy).toHaveBeenCalled();
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

  it('dado error de panel, deberia permitir iniciar pago de licencia', () => {
    component.error = 'Licencia vencida';
    const spy = spyOn(component.pagarLicencia, 'emit');
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('.pv__license-button')).nativeElement as HTMLButtonElement;
    expect(boton.textContent).toContain('Pagar licencia');
    boton.click();

    expect(spy).toHaveBeenCalled();
  });

  describe('modal de vendedor', () => {
    const vendedorX = { id: 'v1', nombre: 'Juan', apellido: 'Perez', email: 'j@j.com', cuit: '20-000' };

    it('dado un vendedor, cuando lo abro, deberia setear vendedorSeleccionado', () => {
      component.verDetalleVendedor(vendedorX);

      expect(component.vendedorSeleccionado()).toEqual(vendedorX);
    });

    it('dado el modal abierto, cuando cierro, deberia limpiar vendedorSeleccionado', () => {
      component.verDetalleVendedor(vendedorX);

      component.cerrarModal();

      expect(component.vendedorSeleccionado()).toBeNull();
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

  describe('iniciarPagoLicencia', () => {
    it('dado pagandoLicencia false, cuando llamo, deberia emitir el evento', () => {
      const spy = spyOn(component.pagarLicencia, 'emit');

      component.iniciarPagoLicencia();

      expect(spy).toHaveBeenCalled();
    });

    it('dado pagandoLicencia true, cuando llamo, no deberia emitir', () => {
      const spy = spyOn(component.pagarLicencia, 'emit');
      component.pagandoLicencia = true;

      component.iniciarPagoLicencia();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('montoLicencia', () => {
    it('dado sin licencia, deberia usar defaults USD y 20', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [] };

      expect(component.montoLicencia()).toBe('USD 20 / mes');
    });

    it('dado licencia con monto y moneda, deberia usarlos', () => {
      component.data = {
        id: '1', nombre: 'X', cue: 'c', buffets: [],
        licencia: { monto: 50, moneda: 'ARS' },
      };

      expect(component.montoLicencia()).toBe('ARS 50 / mes');
    });
  });

  describe('estadoLicencia', () => {
    it('dado licencia con estado ACTIVE, deberia devolver "Activa"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { estado: 'ACTIVE' } };

      expect(component.estadoLicencia()).toBe('Activa');
    });

    it('dado licencia con estado EXPIRED, deberia devolver "Vencida"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { estado: 'EXPIRED' } };

      expect(component.estadoLicencia()).toBe('Vencida');
    });

    it('dado licencia con estado PENDING, deberia devolver "Pendiente"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { estado: 'PENDING' } };

      expect(component.estadoLicencia()).toBe('Pendiente');
    });

    it('dado licencia con estado CANCELLED, deberia devolver "Cancelada"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { estado: 'CANCELLED' } };

      expect(component.estadoLicencia()).toBe('Cancelada');
    });

    it('dado sin licencia pero con fecha futura, deberia calcular "Activa" desde diasRestantes', () => {
      const enUnMes = new Date(Date.now() + 30 * 86_400_000).toISOString();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], fechaVencimientoLicencia: enUnMes };

      expect(component.estadoLicencia()).toBe('Activa');
    });

    it('dado sin fecha ni estado, deberia devolver "Pendiente de pago"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [] };

      expect(component.estadoLicencia()).toBe('Pendiente de pago');
    });

    it('dado un estado no mapeado, deberia devolverlo tal cual', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { estado: 'EXOTICO' } };

      expect(component.estadoLicencia()).toBe('EXOTICO');
    });
  });

  describe('vigenciaLicencia y formatearFecha', () => {
    it('dado una fecha valida, deberia formatearla como dd/mm/aaaa', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: '2026-08-05T22:48:39' } };

      expect(component.vigenciaLicencia()).toBe('05/08/2026');
    });

    it('dado sin fecha, deberia devolver "Sin vigencia activa"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [] };

      expect(component.vigenciaLicencia()).toBe('Sin vigencia activa');
    });

    it('dado una fecha invalida, deberia devolver "Sin vigencia activa"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: 'no-es-fecha' } };

      expect(component.vigenciaLicencia()).toBe('Sin vigencia activa');
    });
  });

  describe('restanteLicencia', () => {
    it('dado sin fecha, deberia devolver "Sin licencia registrada"', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [] };

      expect(component.restanteLicencia()).toBe('Sin licencia registrada');
    });

    it('dado fecha en el pasado, deberia devolver "Licencia vencida"', () => {
      const ayer = new Date(Date.now() - 86_400_000).toISOString();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: ayer } };

      expect(component.restanteLicencia()).toBe('Licencia vencida');
    });

    it('dado fecha hoy, deberia devolver "Vence hoy"', () => {
      const hoy = new Date();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: hoy.toISOString() } };

      expect(component.restanteLicencia()).toBe('Vence hoy');
    });

    it('dado fecha manana, deberia devolver "Resta 1 dia"', () => {
      const manana = new Date(Date.now() + 86_400_000).toISOString();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: manana } };

      expect(component.restanteLicencia()).toBe('Resta 1 dia');
    });

    it('dado fecha en varios dias, deberia devolver el conteo pluralizado', () => {
      const enCincoDias = new Date(Date.now() + 5 * 86_400_000).toISOString();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: enCincoDias } };

      expect(component.restanteLicencia()).toMatch(/Restan \d+ dias/);
    });
  });

  describe('licenciaActiva', () => {
    it('dado fecha futura, deberia ser true', () => {
      const futuro = new Date(Date.now() + 5 * 86_400_000).toISOString();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: futuro } };

      expect(component.licenciaActiva()).toBeTrue();
    });

    it('dado fecha pasada, deberia ser false', () => {
      const pasado = new Date(Date.now() - 5 * 86_400_000).toISOString();
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], licencia: { fechaVencimiento: pasado } };

      expect(component.licenciaActiva()).toBeFalse();
    });

    it('dado solo estado ACTIVE sin fecha, deberia ser true', () => {
      component.data = { id: '1', nombre: 'X', cue: 'c', buffets: [], estadoLicencia: 'ACTIVE' };

      expect(component.licenciaActiva()).toBeTrue();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
