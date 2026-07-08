import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DialogService } from '../../shared/services/dialog.service';
import { SmartChartWidget } from './components/smart-chart-widget/smart-chart-widget';
import { ChildDashboardSummary, TutorGlobalDashboardSummary } from './models/tutor-dashboard.model';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { TutorGlobalDashboardSummaryMother } from './tutor-dashboard.mother';
import { TutorDashboardComponent } from './tutor-dashboard.component';

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

describe('TutorDashboard Integration', () => {
  let fixture: ComponentFixture<TutorDashboardComponent>;
  let dashboardService: jasmine.SpyObj<TutorDashboardService>;

  beforeEach(async () => {
    dashboardService = jasmine.createSpyObj<TutorDashboardService>('TutorDashboardService', [
      'getGlobalDashboard',
      'saveDashboardConfig',
      'transferBalance',
    ]);
    dashboardService.saveDashboardConfig.and.returnValue(of(undefined));

    const usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'setHomeUrl',
      'setNombreNavbar',
      'getUsuarioActual',
    ]);
    usuarioService.getUsuarioActual.and.returnValue({ id: 'u-1', nombre: 'Tutor' });

    await TestBed.configureTestingModule({
      imports: [TutorDashboardComponent],
      providers: [
        { provide: TutorDashboardService, useValue: dashboardService },
        { provide: UsuarioService, useValue: usuarioService },
        {
          provide: DialogService,
          useValue: jasmine.createSpyObj<DialogService>('DialogService', ['alert', 'confirm']),
        },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: PerfilService,
          useValue: {
            perfil: signal({ id: 'p-1', nombre: 'Tutor', plan: 'AVANZADO' }),
            esPlanGratuito: () => false,
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
  });

  afterEach(() => localStorage.clear());

  it('dado el back respondiendo con hijos, cuando se monta la page, deberia setear globalSummary y bajar isLoading', () => {
    givenDashboardDelBack(TutorGlobalDashboardSummaryMother.crear());

    whenMonto();

    expect(fixture.componentInstance.globalSummary?.children.length).toBe(2);
    expect(fixture.componentInstance.isLoading).toBeFalse();
  });

  it('dado que el back devuelve sin dashboardConfig, cuando se monta la page, deberia usar el layout default de 5 items', () => {
    givenDashboardDelBack(TutorGlobalDashboardSummaryMother.crear());

    whenMonto();

    expect(fixture.componentInstance.dashboardItems.length).toBe(5);
  });

  function givenDashboardDelBack(dashboard: TutorGlobalDashboardSummary): void {
    dashboardService.getGlobalDashboard.and.returnValue(of(dashboard));
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
