import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TutorDashboardComponent } from './tutor-dashboard.component';
import { TutorDashboardService } from './services/tutor-dashboard.service';
import { TutorGlobalDashboardSummary, ChildDashboardSummary } from './models/tutor-dashboard.model';
import { By } from '@angular/platform-browser';

describe('TutorDashboardComponent', () => {
  let componente: TutorDashboardComponent;
  let fixture: ComponentFixture<TutorDashboardComponent>;
  let mockDashboardService: jasmine.SpyObj<TutorDashboardService>;

  const mockChild: ChildDashboardSummary = {
    studentId: 'alum-1',
    studentName: 'Juan Perez',
    balance: 500, // < 1000
    spendingPredictionMessage: 'Gastos altos',
    budget: { spent: 8000, limit: 10000, period: 'Junio' }, // 80% (yellow)
    health: { rewardLevel: 'Plata', rewardPoints: 150, pointsToNextLevel: 50, weeklyHealthSummary: 'Mejorando' },
    todayPickups: [],
    recentTransactions: []
  } as ChildDashboardSummary;

  const mockChild2: ChildDashboardSummary = {
    studentId: 'alum-2',
    studentName: 'Maria Lopez',
    balance: 1500,
    spendingPredictionMessage: 'Todo bien',
    budget: { spent: 2000, limit: 10000, period: 'Junio' }, // 20% (green)
    health: { rewardLevel: 'Oro', rewardPoints: 300, pointsToNextLevel: 100, weeklyHealthSummary: 'Excelente' },
    todayPickups: [],
    recentTransactions: []
  } as ChildDashboardSummary;

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('TutorDashboardService', ['getGlobalDashboard', 'transferBalance']);

    await TestBed.configureTestingModule({
      imports: [TutorDashboardComponent],
      providers: [
        { provide: TutorDashboardService, useValue: mockDashboardService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorDashboardComponent);
    componente = fixture.componentInstance;
  });

  describe('Inicialización y selección', () => {
    it('dado que inicializa exitosamente, debe cargar el dashboard y seleccionar el primer hijo', () => {
      mockDashboardService.getGlobalDashboard.and.returnValue(of({
        totalBalance: 2000,
        children: [mockChild, mockChild2]
      } as TutorGlobalDashboardSummary));

      fixture.detectChanges(); // ngOnInit

      expect(componente.isLoading).toBeFalse();
      expect(componente.globalSummary?.totalBalance).toBe(2000);
      expect(componente.selectedChild?.studentId).toBe('alum-1');
    });

    it('dado que el servicio falla, debe manejar el error y quitar isLoading', () => {
      spyOn(console, 'error');
      mockDashboardService.getGlobalDashboard.and.returnValue(throwError(() => new Error('Error')));

      fixture.detectChanges(); // ngOnInit

      expect(console.error).toHaveBeenCalled();
      expect(componente.isLoading).toBeFalse();
      expect(componente.globalSummary).toBeNull();
    });

    it('dado que hace clic en selectChild, debe cambiar el hijo seleccionado', () => {
      componente.selectChild(mockChild2);
      expect(componente.selectedChild).toEqual(mockChild2);
    });
  });

  describe('Getters y cálculos visuales', () => {
    it('dado getInitials, debe devolver 2 letras mayúsculas', () => {
      expect(componente.getInitials('Martin Palermo')).toBe('MP');
      expect(componente.getInitials('Riquelme')).toBe('RI');
      expect(componente.getInitials('')).toBe('');
    });

    it('dado isLowBalance, debe devolver true si el balance es menor a 1000', () => {
      componente.selectedChild = mockChild; // balance 500
      expect(componente.isLowBalance).toBeTrue();

      componente.selectedChild = mockChild2; // balance 1500
      expect(componente.isLowBalance).toBeFalse();
    });

    it('dado budgetPercentage y ColorClass, debe retornar el calculo exacto', () => {
      componente.selectedChild = mockChild; // 80%
      expect(componente.budgetPercentage).toBe(80);
      expect(componente.budgetColorClass).toBe('budget-yellow');

      componente.selectedChild = mockChild2; // 20%
      expect(componente.budgetPercentage).toBe(20);
      expect(componente.budgetColorClass).toBe('budget-green');

      // Prueba red
      componente.selectedChild = { budget: { spent: 9000, limit: 10000 } } as any;
      expect(componente.budgetPercentage).toBe(90);
      expect(componente.budgetColorClass).toBe('budget-red');

      // Prueba null
      componente.selectedChild = null;
      expect(componente.budgetPercentage).toBe(0);
    });
  });

  describe('Modal Smart Action', () => {
    it('dado open y close, debe mutar el estado showSmartActionModal', () => {
      componente.openSmartActionModal();
      expect(componente.showSmartActionModal).toBeTrue();

      componente.closeSmartActionModal();
      expect(componente.showSmartActionModal).toBeFalse();
    });

    it('dado applySmartAction, debe llamar y cerrar', () => {
      spyOn(console, 'log');
      componente.openSmartActionModal();
      componente.applySmartAction();

      expect(console.log).toHaveBeenCalled();
      expect(componente.showSmartActionModal).toBeFalse();
    });
  });

  describe('Drag and Drop (Transferencias)', () => {
    let mockEvent: any;
    let targetHtml: HTMLElement;

    beforeEach(() => {
      targetHtml = document.createElement('div');
      mockEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        dataTransfer: {
          setData: jasmine.createSpy('setData'),
          effectAllowed: '',
          dropEffect: ''
        },
        target: targetHtml,
        currentTarget: targetHtml
      };
    });

    it('dado onDragStart, debe setear el draggedChild y clases CSS', () => {
      componente.onDragStart(mockEvent, mockChild);
      expect(componente.draggedChild).toEqual(mockChild);
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'alum-1');
      expect(targetHtml.classList.contains('dragging')).toBeTrue();
    });

    it('dado onDragEnd, debe resetear arrastre y clases CSS', () => {
      componente.draggedChild = mockChild;
      componente.onDragEnd(mockEvent);
      expect(componente.draggedChild).toBeNull();
      expect(targetHtml.classList.contains('dragging')).toBeFalse();
    });

    it('dado onDragOver, debe prevenir default para permitir el drop', () => {
      componente.onDragOver(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
      expect(targetHtml.classList.contains('drag-over')).toBeTrue();
    });

    it('dado onDragLeave, debe remover el estilo visual', () => {
      componente.onDragLeave(mockEvent);
      expect(targetHtml.classList.contains('drag-over')).toBeFalse();
    });

    it('dado onDrop con mismo niño o sin monto, debe emitir alerta o ignorar', () => {
      spyOn(window, 'alert');
      componente.draggedChild = mockChild; // Origen alum-1
      
      // Mismo nino = ignorar lógica
      componente.onDrop(mockEvent, mockChild);
      expect(mockDashboardService.transferBalance).not.toHaveBeenCalled();

      // Distinto nino pero sin monto
      componente.transferAmounts['alum-1'] = 0;
      componente.onDrop(mockEvent, mockChild2); // Target alum-2
      expect(window.alert).toHaveBeenCalledWith('Debes ingresar un monto mayor a 0 antes de arrastrar para transferir.');
      expect(mockDashboardService.transferBalance).not.toHaveBeenCalled();
    });

    it('dado onDrop con monto valido, debe llamar al servicio y refrescar', () => {
      spyOn(console, 'log');
      spyOn(componente, 'ngOnInit');
      componente.draggedChild = mockChild; // Origen alum-1
      componente.transferAmounts['alum-1'] = 500;
      
      mockDashboardService.transferBalance.and.returnValue(of(undefined)); // Exito

      componente.onDrop(mockEvent, mockChild2); // Target alum-2

      expect(mockDashboardService.transferBalance).toHaveBeenCalledWith('alum-1', 'alum-2', 500);
      expect(componente.transferAmounts['alum-1']).toBeNull();
      expect(componente.ngOnInit).toHaveBeenCalled();
    });

    it('dado onDrop con error de red, debe mostrar alerta', () => {
      spyOn(window, 'alert');
      componente.draggedChild = mockChild;
      componente.transferAmounts['alum-1'] = 500;
      
      mockDashboardService.transferBalance.and.returnValue(throwError(() => new Error('API Error')));

      componente.onDrop(mockEvent, mockChild2);

      expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching('Hubo un error al procesar'));
    });
  });
});
