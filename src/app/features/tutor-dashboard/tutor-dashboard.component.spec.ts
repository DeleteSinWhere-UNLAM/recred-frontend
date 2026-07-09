import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DialogService } from '../../shared/services/dialog.service';
import { SmartChartWidget, ChartWidgetConfig } from './components/smart-chart-widget/smart-chart-widget';
import { ChildDashboardSummary } from './models/tutor-dashboard.model';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { DashboardWidget } from './tutor-dashboard.component';
import {
  ChildDashboardSummaryMother,
  TutorGlobalDashboardSummaryMother,
} from './tutor-dashboard.mother';
import { TutorDashboardComponent } from './tutor-dashboard.component';

interface Perfil {
  id: string;
  nombre: string;
  plan?: string;
}

interface AlertaEsperada {
  matcher: string | RegExp | jasmine.AsymmetricMatcher<string>;
  titulo: string;
}

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-smart-chart-widget', template: '', standalone: true })
class SmartChartWidgetStub {
  @Input() children: ChildDashboardSummary[] = [];
  @Input() config: unknown = {};
  @Output() configChange = new EventEmitter<unknown>();
  @Output() closeCard = new EventEmitter<void>();
}

class DashboardWidgetMother {
  static crear(override: Partial<DashboardWidget> = {}): DashboardWidget {
    return {
      id: 'w-1',
      type: 'finance',
      cols: 1,
      rows: 3,
      x: 0,
      y: 0,
      ...override,
    };
  }

  static crearVarios(cantidad: number, type = 'finance'): DashboardWidget[] {
    return Array.from({ length: cantidad }, (_, i) =>
      DashboardWidgetMother.crear({ id: `w-${i}`, type, y: i * 3 }),
    );
  }
}

class DragEventMother {
  static crearParaDragStart(dataTransfer: DataTransfer | null = null): DragEvent {
    return {
      preventDefault: jasmine.createSpy(),
      dataTransfer,
      target: document.createElement('div'),
    } as unknown as DragEvent;
  }

  static crearParaDrop(): DragEvent {
    return {
      preventDefault: jasmine.createSpy(),
      currentTarget: document.createElement('div'),
    } as unknown as DragEvent;
  }

  static crearParaDragOver(dataTransfer: DataTransfer | null, target: HTMLElement): DragEvent {
    return {
      preventDefault: jasmine.createSpy(),
      dataTransfer,
      currentTarget: target,
    } as unknown as DragEvent;
  }
}

describe('TutorDashboardComponent', () => {
  let fixture: ComponentFixture<TutorDashboardComponent>;
  let component: TutorDashboardComponent;
  let dashboardService: jasmine.SpyObj<TutorDashboardService>;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let dialogService: jasmine.SpyObj<DialogService>;
  let router: jasmine.SpyObj<Router>;
  let perfilSignal: ReturnType<typeof signal<Perfil | null>>;

  async function givenComponenteMontado(perfil: Perfil | null = { id: 'p-1', nombre: 'Tutor Test', plan: 'AVANZADO' }): Promise<void> {
    dashboardService = jasmine.createSpyObj<TutorDashboardService>('TutorDashboardService', [
      'getGlobalDashboard',
      'saveDashboardConfig',
      'transferBalance',
    ]);
    dashboardService.getGlobalDashboard.and.returnValue(
      of(TutorGlobalDashboardSummaryMother.crear()),
    );
    dashboardService.saveDashboardConfig.and.returnValue(of(undefined));
    dashboardService.transferBalance.and.returnValue(of(undefined));

    usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'setHomeUrl',
      'setNombreNavbar',
      'getUsuarioActual',
    ]);
    usuarioService.getUsuarioActual.and.returnValue({ id: 'u-1', nombre: 'Fallback' });

    dialogService = jasmine.createSpyObj<DialogService>('DialogService', ['alert', 'confirm']);
    dialogService.alert.and.resolveTo(true);
    dialogService.confirm.and.resolveTo(true);

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    perfilSignal = signal<Perfil | null>(perfil);

    await TestBed.configureTestingModule({
      imports: [TutorDashboardComponent],
      providers: [
        { provide: TutorDashboardService, useValue: dashboardService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: DialogService, useValue: dialogService },
        { provide: Router, useValue: router },
        {
          provide: PerfilService,
          useValue: {
            perfil: perfilSignal,
            esPlanGratuito: () => {
              const plan = perfilSignal()?.plan?.toUpperCase();
              return plan !== 'INTERMEDIO' && plan !== 'AVANZADO';
            },
          },
        },
      ],
    })
      .overrideComponent(TutorDashboardComponent, {
        remove: { imports: [NavbarComponent, SmartChartWidget] },
        add: { imports: [NavbarStub, SmartChartWidgetStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TutorDashboardComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    fixture?.destroy();
    localStorage.clear();
  });

  describe('constructor', () => {
    it('dado un perfil con nombre, cuando se construye, deberia setear /tutor como home y el nombre en la navbar', async () => {
      await givenComponenteMontado();

      thenSeSeteoHomeUrl('/tutor');
      thenSeSeteoNombreNavbar('Tutor Test');
    });

    it('dado que no hay perfil, cuando se construye, deberia usar el nombre del usuarioActual', async () => {
      await givenComponenteMontado(null);

      thenSeSeteoNombreNavbar('Fallback');
    });
  });

  describe('ngOnInit', () => {
    beforeEach(async () => await givenComponenteMontado());

    it('dado la page recien montada, cuando detecto cambios, deberia pedir el dashboard, filtrar el primer nombre y seleccionar el primer hijo', () => {
      whenDetectoCambios();

      thenSePidioElDashboard();
      thenElPrimerHijoTieneNombre('Ana');
      thenElSelectedChildTieneId('student-2');
      thenIsLoadingEs(false);
    });

    it('dado ya habia un selectedChild, cuando recargo, deberia mantener la seleccion si sigue existiendo', () => {
      whenDetectoCambios();
      const seleccionado = component.globalSummary!.children[1];
      givenSelectedChild(seleccionado);

      whenRecargoDashboard();

      thenElSelectedChildTieneId(seleccionado.studentId);
    });

    it('dado un dashboardConfig valido en el back, cuando cargo, deberia parsearlo como layout', () => {
      const layout = [DashboardWidgetMother.crear({ id: 'custom', type: 'finance' })];
      givenGetGlobalDashboardResuelve(
        TutorGlobalDashboardSummaryMother.crearConConfig(layout),
      );

      whenDetectoCambios();

      thenLaCantidadDeWidgetsEs(1);
      thenElPrimerWidgetEs('custom', 'finance');
    });

    it('dado un dashboardConfig invalido, cuando cargo, deberia caer al layout default', () => {
      spyOn(console, 'error');
      givenGetGlobalDashboardResuelve(
        TutorGlobalDashboardSummaryMother.crear({ dashboardConfig: 'no-es-json' }),
      );

      whenDetectoCambios();

      thenLaCantidadDeWidgetsEs(5);
    });

    it('dado que el back falla, cuando cargo, deberia dejar isLoading en false sin romper', () => {
      spyOn(console, 'error');
      givenGetGlobalDashboardFalla();

      whenDetectoCambios();

      thenIsLoadingEs(false);
    });
  });

  describe('volver', () => {
    it('cuando hago click en volver, deberia navegar a /tutor', async () => {
      await givenComponenteMontado();
      whenDetectoCambios();

      whenVuelvo();

      thenSeNavegoA(['/tutor']);
    });
  });

  describe('selectChild', () => {
    it('cuando selecciono un hijo, deberia setearlo como selectedChild', async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
      const nuevo = ChildDashboardSummaryMother.crear({ studentId: 'nuevo' });

      whenSelectChild(nuevo);

      thenElSelectedChildEs(nuevo);
    });
  });

  describe('getInitials', () => {
    beforeEach(async () => await givenComponenteMontado());

    it('dado un nombre con dos palabras, cuando pido getInitials, deberia devolver las iniciales de las dos primeras', () => {
      thenGetInitialsEs('Julián García', 'JG');
    });

    it('dado un nombre con una palabra, cuando pido getInitials, deberia devolver los dos primeros caracteres', () => {
      thenGetInitialsEs('Ana', 'AN');
    });

    it('dado un nombre vacio, cuando pido getInitials, deberia devolver ""', () => {
      thenGetInitialsEs('', '');
    });
  });

  describe('getters de balance y budget', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('dado un balance menor a 1000, isLowBalance deberia ser true', () => {
      givenSelectedChild(ChildDashboardSummaryMother.crear({ balance: 500 }));

      thenIsLowBalanceEs(true);
    });

    it('dado spent 500 y limit 2000, budgetPercentage deberia ser 25 y color green', () => {
      givenSelectedChild(ChildDashboardSummaryMother.crear());

      thenBudgetPercentageEs(25);
      thenBudgetColorEs('budget-green');
    });

    it('dado spent 1400 y limit 2000, cuando leo budgetColor, deberia estar en yellow', () => {
      givenSelectedChild(
        ChildDashboardSummaryMother.crear({ budget: { period: 'MENSUAL', spent: 1400, limit: 2000 } }),
      );

      thenBudgetColorEs('budget-yellow');
    });

    it('dado spent 1900 y limit 2000, cuando leo budgetColor, deberia estar en red', () => {
      givenSelectedChild(
        ChildDashboardSummaryMother.crear({ budget: { period: 'MENSUAL', spent: 1900, limit: 2000 } }),
      );

      thenBudgetColorEs('budget-red');
    });

    it('dado un hijo sin budget, budgetPercentage deberia ser 0', () => {
      givenSelectedChild(ChildDashboardSummaryMother.crear({ budget: undefined }));

      thenBudgetPercentageEs(0);
    });
  });

  describe('plan gratuito vs pago', () => {
    it('dado plan INTERMEDIO, esPremium deberia ser true y puedeAgregarTarjeta true sin limite', async () => {
      await givenComponenteMontado({ id: 'p-1', nombre: 'Tutor', plan: 'INTERMEDIO' });
      whenDetectoCambios();

      thenEsPlanGratuitoEs(false);
      thenEsPremiumEs(true);
      thenPuedeAgregarTarjetaEs(true);
    });

    it('dado plan GRATUITO con 5 widgets, puedeAgregarTarjeta deberia ser false', async () => {
      await givenComponenteMontado({ id: 'p-1', nombre: 'Tutor', plan: 'GRATUITO' });
      whenDetectoCambios();
      givenWidgets(DashboardWidgetMother.crearVarios(5));

      thenPuedeAgregarTarjetaEs(false);
    });
  });

  describe('add / remove / clear cards', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('cuando agrego una smart card, deberia sumar un widget de tipo smart-chart', () => {
      const inicial = component.dashboardItems.length;

      whenAgregoSmartCard();

      thenLaCantidadDeWidgetsEs(inicial + 1);
      thenElWidgetEnPosicionTieneType(inicial, 'smart-chart');
    });

    it('cuando agrego finance/health/logistics/transactions, deberia agregar cada tipo', () => {
      givenWidgets([]);

      whenAgregoLasCuatroCardsBasicas();

      thenLosTiposDeWidgetsSon(['finance', 'health', 'logistics', 'transactions']);
    });

    it('cuando removeCard, deberia sacar el item del array', () => {
      givenWidgets([
        DashboardWidgetMother.crear({ id: 'a', type: 'finance' }),
        DashboardWidgetMother.crear({ id: 'b', type: 'health', y: 3 }),
      ]);

      whenRemuevoCard('a');

      thenLaCantidadDeWidgetsEs(1);
      thenElWidgetEnPosicionTieneId(0, 'b');
    });

    it('cuando clearAllCards y confirmo, deberia vaciar los items', async () => {
      givenDialogConfirmResuelve(true);

      await whenClearAllCards();

      thenLosWidgetsEstanVacios();
    });

    it('cuando clearAllCards y cancelo, no deberia vaciar los items', async () => {
      givenWidgets([DashboardWidgetMother.crear({ id: 'a', type: 'finance' })]);
      givenDialogConfirmResuelve(false);

      await whenClearAllCards();

      thenLaCantidadDeWidgetsEs(1);
    });
  });

  describe('onWidgetConfigChange', () => {
    it('cuando cambia la config de un widget, deberia actualizar el widgetConfig del item', async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
      const item = DashboardWidgetMother.crear({ id: 'a', type: 'smart-chart' });
      const config: ChartWidgetConfig = { chartType: 'pie', dataSource: 'health' };

      whenCambioConfigDeWidget(item, config);

      thenElWidgetConfigEs(item, config);
    });
  });

  describe('getChildData y pickup helpers', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('dado un item con studentId conocido, cuando pido childData, deberia devolver ese hijo', () => {
      const item = DashboardWidgetMother.crear({ id: 'a', type: 'finance', studentId: 'student-2' });

      thenElChildDataTieneStudentId(item, 'student-2');
    });

    it('dado un item sin studentId, cuando pido childData, deberia asignar el primer hijo y setear item.studentId', () => {
      const item = DashboardWidgetMother.crear({ id: 'a', type: 'finance' });
      const primeroId = component.globalSummary!.children[0].studentId;

      thenElChildDataTieneStudentId(item, primeroId);
      thenElItemStudentIdEs(item, primeroId);
    });

    it('dado un pickup con formato "Mediodia (12:00-13:00)", cuando pido getPickupType, deberia devolver "Mediodia"', () => {
      thenGetPickupTypeEs('Mediodía (12:00-13:00)', 'Mediodía');
    });

    it('dado un pickup con formato "Mediodia (12:00-13:00)", cuando pido getPickupTimeRange, deberia devolver "12:00-13:00"', () => {
      thenGetPickupTimeRangeEs('Mediodía (12:00-13:00)', '12:00-13:00');
    });

    it('dado un pickup con string vacio, cuando pido getPickupType/Range, deberia devolver ""', () => {
      thenGetPickupTypeEs('', '');
      thenGetPickupTimeRangeEs('', '');
    });
  });

  describe('openTransferModal', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('dado plan GRATUITO, cuando abro el modal, deberia mostrar alerta y no abrirlo', () => {
      givenPlanGratuito();

      whenAbroTransferModal(ChildDashboardSummaryMother.crear());

      thenSeMostroAlerta({ matcher: 'La transferencia entre hijos esta disponible con plan Avanzado.', titulo: 'Plan Avanzado' });
      thenElTransferModalEsta(false);
    });

    it('dado un monto en 0, cuando abro el modal, deberia mostrar alerta de monto invalido', () => {
      const source = ChildDashboardSummaryMother.crear();
      givenTransferAmount(source.studentId, 0);

      whenAbroTransferModal(source);

      thenSeMostroAlerta({ matcher: 'Debes ingresar un monto mayor a 0 antes de transferir.', titulo: 'Monto Inválido' });
    });

    it('dado un monto valido y un unico destinatario posible, cuando abro el modal, deberia autoseleccionarlo', () => {
      const source = component.globalSummary!.children[0];
      givenTransferAmount(source.studentId, 500);

      whenAbroTransferModal(source);

      thenElTransferModalEsta(true);
      thenElTargetChildIdEs(component.globalSummary!.children[1].studentId);
    });
  });

  describe('confirmTransfer', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
      givenTransferEnProceso(500);
    });

    it('dado un target valido, cuando confirmo, deberia llamar al service y cerrar el modal', () => {
      whenConfirmoTransfer();

      thenSeLlamoTransferBalance();
      thenElTransferModalEsta(false);
    });

    it('dado que no hay target, cuando confirmo, deberia mostrar alerta y no llamar al service', () => {
      component.transferTargetChildId = '';

      whenConfirmoTransfer();

      thenSeMostroAlerta({ matcher: 'Debes seleccionar un destinatario.', titulo: 'Destinatario Inválido' });
      thenNoSeLlamoTransferBalance();
    });

    it('dado que falla la transferencia, cuando confirmo, deberia mostrar alerta de error', fakeAsync(() => {
      spyOn(console, 'error');
      givenTransferBalanceFalla();

      whenConfirmoTransfer();
      tick();

      thenSeMostroAlerta({ matcher: jasmine.stringMatching(/error al procesar/i), titulo: 'Error de Transferencia' });
    }));

    it('dado isTransferring true, cuando confirmo, no deberia llamar al service', () => {
      component.isTransferring = true;
      dashboardService.transferBalance.calls.reset();

      whenConfirmoTransfer();

      thenNoSeLlamoTransferBalance();
    });

    it('dado un monto invalido, cuando confirmo, no deberia llamar al service', () => {
      component.transferAmounts[component.transferSourceChild!.studentId] = 0;
      dashboardService.transferBalance.calls.reset();

      whenConfirmoTransfer();

      thenNoSeLlamoTransferBalance();
    });
  });

  describe('closeTransferModal y modales', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('dado isTransferring true, cuando cierro el modal, no deberia cerrarlo', () => {
      component.showTransferModal = true;
      component.isTransferring = true;

      whenCierroTransferModal();

      thenElTransferModalEsta(true);
    });

    it('cuando abro smart action modal, deberia setear la flag y cerrarlo deberia bajarla', () => {
      whenAbroSmartActionModal();
      thenElSmartActionModalEsta(true);

      whenCierroSmartActionModal();
      thenElSmartActionModalEsta(false);
    });

    it('cuando applySmartAction, deberia cerrar el modal', () => {
      component.showSmartActionModal = true;

      whenAplicoSmartAction();

      thenElSmartActionModalEsta(false);
    });
  });

  describe('saveLayout', () => {
    it('cuando guardo el layout, deberia persistirlo en localStorage y luego al back con debounce', fakeAsync(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
      givenWidgets([DashboardWidgetMother.crear({ id: 'x', type: 'finance' })]);

      whenGuardoLayout();
      thenLocalStorageContiene('tutorDashboardGrid', 'finance');

      tick(1000);

      thenSeGuardoElDashboardConfig();
    }));

    it('dado dos saveLayout seguidos, deberia limpiar el timeout y llamar al back una sola vez', fakeAsync(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();

      whenGuardoLayout();
      whenGuardoLayout();
      tick(1000);

      thenSeGuardoElDashboardConfigNVeces(1);
    }));

    it('dado que saveDashboardConfig falla, cuando guardo, deberia loguear el error', fakeAsync(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
      const spyError = spyOn(console, 'error');
      givenSaveDashboardConfigFalla();

      whenGuardoLayout();
      tick(1000);

      expect(spyError).toHaveBeenCalled();
    }));
  });

  describe('drag & drop entre hijos', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('dado plan GRATUITO, cuando arrastro, deberia cancelar el drag', () => {
      givenPlanGratuito();
      const event = DragEventMother.crearParaDragStart();

      whenDragStart(event, ChildDashboardSummaryMother.crear());

      expect(event.preventDefault).toHaveBeenCalled();
      thenElDraggedChildEs(null);
    });

    it('dado plan avanzado con dataTransfer, cuando arrastro, deberia setear draggedChild y usar dataTransfer', () => {
      const dataTransfer = { setData: jasmine.createSpy(), effectAllowed: '' } as unknown as DataTransfer;
      const event = DragEventMother.crearParaDragStart(dataTransfer);
      const child = component.globalSummary!.children[0];

      whenDragStart(event, child);

      thenElDraggedChildEs(child);
      expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', child.studentId);
    });

    it('dado plan avanzado sin dataTransfer, cuando arrastro, no deberia romper y draggedChild deberia setearse', () => {
      const event = DragEventMother.crearParaDragStart(null);
      const child = component.globalSummary!.children[0];

      whenDragStart(event, child);

      thenElDraggedChildEs(child);
    });

    it('dado onDragEnd, deberia limpiar draggedChild y sacar la clase dragging del target', () => {
      const target = document.createElement('div');
      target.classList.add('dragging');
      givenDraggedChild(component.globalSummary!.children[0]);

      whenDragEnd({ target } as unknown as DragEvent);

      thenElDraggedChildEs(null);
      expect(target.classList.contains('dragging')).toBeFalse();
    });

    it('dado onDragOver con dataTransfer, deberia setear dropEffect="move" y agregar drag-over', () => {
      const dataTransfer = { dropEffect: '' } as unknown as DataTransfer;
      const target = document.createElement('div');
      const event = DragEventMother.crearParaDragOver(dataTransfer, target);

      whenDragOver(event);

      expect(dataTransfer.dropEffect).toBe('move');
      expect(target.classList.contains('drag-over')).toBeTrue();
    });

    it('dado onDragOver sin dataTransfer, no deberia romper y agregar drag-over igual', () => {
      const target = document.createElement('div');
      const event = DragEventMother.crearParaDragOver(null, target);

      whenDragOver(event);

      expect(target.classList.contains('drag-over')).toBeTrue();
    });

    it('dado onDragLeave, deberia sacar la clase drag-over del target', () => {
      const target = document.createElement('div');
      target.classList.add('drag-over');
      const event = { currentTarget: target } as unknown as DragEvent;

      whenDragLeave(event);

      expect(target.classList.contains('drag-over')).toBeFalse();
    });

    it('dado un drop entre dos hijos con monto valido, cuando dropeo, deberia llamar a transferBalance', async () => {
      const source = component.globalSummary!.children[0];
      const target = component.globalSummary!.children[1];
      givenDraggedChild(source);
      givenTransferAmount(source.studentId, 500);

      await whenDrop(DragEventMother.crearParaDrop(), target);

      thenSeTransfirioBalance(source.studentId, target.studentId, 500);
    });

    it('dado un drop sin monto, cuando dropeo, deberia mostrar alerta de monto invalido', async () => {
      const source = component.globalSummary!.children[0];
      const target = component.globalSummary!.children[1];
      givenDraggedChild(source);
      givenTransferAmount(source.studentId, 0);

      await whenDrop(DragEventMother.crearParaDrop(), target);

      thenSeMostroAlerta({ matcher: 'Debes ingresar un monto mayor a 0 antes de arrastrar para transferir.', titulo: 'Monto Inválido' });
      thenNoSeLlamoTransferBalance();
    });

    it('dado plan GRATUITO, cuando dropeo, deberia mostrar la alerta de gratuito y no llamar al service', async () => {
      givenPlanGratuito();

      await whenDrop(DragEventMother.crearParaDrop(), component.globalSummary!.children[1]);

      thenSeMostroAlerta({ matcher: jasmine.stringMatching(/disponible con plan Avanzado/i), titulo: 'Plan Avanzado' });
      thenNoSeLlamoTransferBalance();
    });

    it('dado un drop sobre el mismo hijo, no deberia hacer nada', async () => {
      const same = component.globalSummary!.children[0];
      givenDraggedChild(same);
      givenTransferAmount(same.studentId, 500);

      await whenDrop(DragEventMother.crearParaDrop(), same);

      thenNoSeLlamoTransferBalance();
    });

    it('dado que la transferencia por drop falla, cuando dropeo, deberia mostrar alerta de error', fakeAsync(() => {
      spyOn(console, 'error');
      givenTransferBalanceFalla();
      const source = component.globalSummary!.children[0];
      const target = component.globalSummary!.children[1];
      givenDraggedChild(source);
      givenTransferAmount(source.studentId, 500);

      void whenDrop(DragEventMother.crearParaDrop(), target);
      tick();

      thenSeMostroAlerta({ matcher: jasmine.stringMatching(/error al procesar/i), titulo: 'Error de Transferencia' });
    }));
  });

  describe('cobertura extra de carga', () => {
    beforeEach(async () => {
      await givenComponenteMontado();
      whenDetectoCambios();
    });

    it('dado un savedLayout valido en localStorage y sin config back, cuando cargo, deberia usar el saved', () => {
      const layout = [DashboardWidgetMother.crear({ id: 'saved', type: 'finance' })];
      givenLocalStorageSaved('tutorDashboardGrid', JSON.stringify(layout));
      givenGetGlobalDashboardResuelve(
        TutorGlobalDashboardSummaryMother.crear({ dashboardConfig: undefined }),
      );

      whenRecargoDashboard();

      thenElWidgetEnPosicionTieneId(0, 'saved');
    });

    it('dado un savedLayout invalido en localStorage, cuando cargo, deberia caer al layout default', () => {
      spyOn(console, 'error');
      givenLocalStorageSaved('tutorDashboardGrid', 'no-es-json');
      givenGetGlobalDashboardResuelve(
        TutorGlobalDashboardSummaryMother.crear({ dashboardConfig: undefined }),
      );

      whenRecargoDashboard();

      thenLaCantidadDeWidgetsEs(5);
    });

    it('dado que no hay children, cuando cargo, no deberia seleccionar ningun hijo', () => {
      givenGetGlobalDashboardResuelve(
        TutorGlobalDashboardSummaryMother.crear({ children: [] }),
      );
      givenSelectedChild(null);

      whenRecargoDashboard();

      thenElSelectedChildEs(null);
    });

    it('dado children con studentName undefined, cuando cargo, deberia usar "" como nombre', () => {
      givenGetGlobalDashboardResuelve(
        TutorGlobalDashboardSummaryMother.crear({
          children: [ChildDashboardSummaryMother.crear({ studentName: undefined as unknown as string })],
        }),
      );

      whenRecargoDashboard();

      thenElPrimerHijoTieneNombre('');
    });

    it('dado sin globalSummary, cuando pido getChildData, deberia devolver null', () => {
      component.globalSummary = null;
      const item = DashboardWidgetMother.crear({ id: 'a', type: 'finance' });

      thenElChildDataEs(item, null);
    });

    it('dado un studentId no encontrado y sin children, cuando pido getChildData, deberia devolver null', () => {
      component.globalSummary = { ...component.globalSummary!, children: [] };
      const item = DashboardWidgetMother.crear({ id: 'a', type: 'finance', studentId: 'no-existe' });

      thenElChildDataEs(item, null);
    });

    it('dado addSmartCard/addFinance/etc sin globalSummary, cuando agrego, no deberia romper y deberia sumar 5 widgets', () => {
      component.globalSummary = null;
      const inicial = component.dashboardItems.length;

      whenAgregoTodasLasCards();

      thenLaCantidadDeWidgetsEs(inicial + 5);
    });
  });

  function givenGetGlobalDashboardResuelve(summary: ReturnType<typeof TutorGlobalDashboardSummaryMother.crear>): void {
    dashboardService.getGlobalDashboard.and.returnValue(of(summary));
  }

  function givenGetGlobalDashboardFalla(): void {
    dashboardService.getGlobalDashboard.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenTransferBalanceFalla(): void {
    dashboardService.transferBalance.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenSaveDashboardConfigFalla(): void {
    dashboardService.saveDashboardConfig.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenDialogConfirmResuelve(valor: boolean): void {
    dialogService.confirm.and.resolveTo(valor);
  }

  function givenSelectedChild(child: ChildDashboardSummary | null): void {
    component.selectedChild = child;
  }

  function givenDraggedChild(child: ChildDashboardSummary | null): void {
    component.draggedChild = child;
  }

  function givenTransferAmount(studentId: string, monto: number): void {
    component.transferAmounts[studentId] = monto;
  }

  function givenWidgets(widgets: DashboardWidget[]): void {
    component.dashboardItems = widgets;
  }

  function givenPlanGratuito(): void {
    perfilSignal.set({ id: 'p-1', nombre: 'Tutor', plan: 'GRATUITO' });
  }

  function givenTransferEnProceso(monto: number): void {
    component.transferSourceChild = component.globalSummary!.children[0];
    component.transferTargetChildId = component.globalSummary!.children[1].studentId;
    component.transferAmounts[component.transferSourceChild.studentId] = monto;
    component.showTransferModal = true;
  }

  function givenLocalStorageSaved(key: string, valor: string): void {
    localStorage.setItem(key, valor);
  }

  function whenDetectoCambios(): void {
    fixture.detectChanges();
  }

  function whenRecargoDashboard(): void {
    component.loadDashboardData();
  }

  function whenVuelvo(): void {
    component.volver();
  }

  function whenSelectChild(child: ChildDashboardSummary): void {
    component.selectChild(child);
  }

  function whenAgregoSmartCard(): void {
    component.addSmartCard();
  }

  function whenAgregoLasCuatroCardsBasicas(): void {
    component.addFinanceCard();
    component.addHealthCard();
    component.addLogisticsCard();
    component.addTransactionsCard();
  }

  function whenAgregoTodasLasCards(): void {
    whenAgregoLasCuatroCardsBasicas();
    component.addSmartCard();
  }

  function whenRemuevoCard(id: string): void {
    component.removeCard(id);
  }

  async function whenClearAllCards(): Promise<void> {
    await component.clearAllCards();
  }

  function whenCambioConfigDeWidget(item: DashboardWidget, config: ChartWidgetConfig): void {
    component.onWidgetConfigChange(item, config);
  }

  function whenAbroTransferModal(source: ChildDashboardSummary): void {
    component.openTransferModal(source);
  }

  function whenConfirmoTransfer(): void {
    component.confirmTransfer();
  }

  function whenCierroTransferModal(): void {
    component.closeTransferModal();
  }

  function whenAbroSmartActionModal(): void {
    component.openSmartActionModal();
  }

  function whenCierroSmartActionModal(): void {
    component.closeSmartActionModal();
  }

  function whenAplicoSmartAction(): void {
    component.applySmartAction();
  }

  function whenGuardoLayout(): void {
    component.saveLayout();
  }

  function whenDragStart(event: DragEvent, child: ChildDashboardSummary): void {
    component.onDragStart(event, child);
  }

  function whenDragEnd(event: DragEvent): void {
    component.onDragEnd(event);
  }

  function whenDragOver(event: DragEvent): void {
    component.onDragOver(event);
  }

  function whenDragLeave(event: DragEvent): void {
    component.onDragLeave(event);
  }

  async function whenDrop(event: DragEvent, target: ChildDashboardSummary): Promise<void> {
    await component.onDrop(event, target);
  }

  function thenSeSeteoHomeUrl(url: string): void {
    expect(usuarioService.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenSeSeteoNombreNavbar(nombre: string): void {
    expect(usuarioService.setNombreNavbar).toHaveBeenCalledWith(nombre);
  }

  function thenSePidioElDashboard(): void {
    expect(dashboardService.getGlobalDashboard).toHaveBeenCalled();
  }

  function thenElPrimerHijoTieneNombre(nombre: string): void {
    expect(component.globalSummary?.children[0].studentName).toBe(nombre);
  }

  function thenElSelectedChildTieneId(id: string): void {
    expect(component.selectedChild?.studentId).toBe(id);
  }

  function thenElSelectedChildEs(child: ChildDashboardSummary | null): void {
    expect(component.selectedChild).toEqual(child);
  }

  function thenIsLoadingEs(esperado: boolean): void {
    expect(component.isLoading).toBe(esperado);
  }

  function thenLaCantidadDeWidgetsEs(cantidad: number): void {
    expect(component.dashboardItems.length).toBe(cantidad);
  }

  function thenElPrimerWidgetEs(id: string, type: string): void {
    expect(component.dashboardItems[0].id).toBe(id);
    expect(component.dashboardItems[0].type).toBe(type);
  }

  function thenElWidgetEnPosicionTieneId(pos: number, id: string): void {
    expect(component.dashboardItems[pos].id).toBe(id);
  }

  function thenElWidgetEnPosicionTieneType(pos: number, type: string): void {
    expect(component.dashboardItems[pos].type).toBe(type);
  }

  function thenLosTiposDeWidgetsSon(tipos: string[]): void {
    expect(component.dashboardItems.map((i) => i.type)).toEqual(tipos);
  }

  function thenLosWidgetsEstanVacios(): void {
    expect(component.dashboardItems).toEqual([]);
  }

  function thenElWidgetConfigEs(item: DashboardWidget, config: ChartWidgetConfig): void {
    expect(item.widgetConfig).toEqual(config);
  }

  function thenSeNavegoA(commands: string[]): void {
    expect(router.navigate).toHaveBeenCalledWith(commands);
  }

  function thenGetInitialsEs(entrada: string, esperado: string): void {
    expect(component.getInitials(entrada)).toBe(esperado);
  }

  function thenIsLowBalanceEs(esperado: boolean): void {
    expect(component.isLowBalance).toBe(esperado);
  }

  function thenBudgetPercentageEs(esperado: number): void {
    expect(component.budgetPercentage).toBe(esperado);
  }

  function thenBudgetColorEs(esperado: string): void {
    expect(component.budgetColorClass).toBe(esperado);
  }

  function thenEsPlanGratuitoEs(esperado: boolean): void {
    expect(component.esPlanGratuito).toBe(esperado);
  }

  function thenEsPremiumEs(esperado: boolean): void {
    expect(component.esPremium).toBe(esperado);
  }

  function thenPuedeAgregarTarjetaEs(esperado: boolean): void {
    expect(component.puedeAgregarTarjeta).toBe(esperado);
  }

  function thenElChildDataTieneStudentId(item: DashboardWidget, id: string): void {
    expect(component.getChildData(item)?.studentId).toBe(id);
  }

  function thenElChildDataEs(item: DashboardWidget, esperado: ChildDashboardSummary | null): void {
    expect(component.getChildData(item)).toBe(esperado);
  }

  function thenElItemStudentIdEs(item: DashboardWidget, id: string): void {
    expect(item.studentId).toBe(id);
  }

  function thenGetPickupTypeEs(entrada: string, esperado: string): void {
    expect(component.getPickupType(entrada)).toBe(esperado);
  }

  function thenGetPickupTimeRangeEs(entrada: string, esperado: string): void {
    expect(component.getPickupTimeRange(entrada)).toBe(esperado);
  }

  function thenSeMostroAlerta(esperada: AlertaEsperada): void {
    expect(dialogService.alert).toHaveBeenCalledWith(esperada.matcher as never, esperada.titulo);
  }

  function thenElTransferModalEsta(abierto: boolean): void {
    expect(component.showTransferModal).toBe(abierto);
  }

  function thenElTargetChildIdEs(id: string): void {
    expect(component.transferTargetChildId).toBe(id);
  }

  function thenSeLlamoTransferBalance(): void {
    expect(dashboardService.transferBalance).toHaveBeenCalled();
  }

  function thenNoSeLlamoTransferBalance(): void {
    expect(dashboardService.transferBalance).not.toHaveBeenCalled();
  }

  function thenSeTransfirioBalance(source: string, target: string, monto: number): void {
    expect(dashboardService.transferBalance).toHaveBeenCalledWith(source, target, monto);
  }

  function thenElSmartActionModalEsta(abierto: boolean): void {
    expect(component.showSmartActionModal).toBe(abierto);
  }

  function thenLocalStorageContiene(key: string, fragmento: string): void {
    expect(localStorage.getItem(key)).toContain(fragmento);
  }

  function thenSeGuardoElDashboardConfig(): void {
    expect(dashboardService.saveDashboardConfig).toHaveBeenCalled();
  }

  function thenSeGuardoElDashboardConfigNVeces(n: number): void {
    expect(dashboardService.saveDashboardConfig).toHaveBeenCalledTimes(n);
  }

  function thenElDraggedChildEs(esperado: ChildDashboardSummary | null): void {
    expect(component.draggedChild).toBe(esperado);
  }
});
