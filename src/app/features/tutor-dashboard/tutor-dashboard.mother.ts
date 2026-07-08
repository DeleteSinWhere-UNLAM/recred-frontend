import {
  BudgetSummary,
  ChildDashboardSummary,
  HealthSummary,
  ScheduledPickup,
  SmartAction,
  TransactionSummary,
  TutorGlobalDashboardSummary,
} from './models/tutor-dashboard.model';

export const TUTOR_ID_TEST = 'tutor-1';
export const STUDENT_ID_TEST = 'student-1';

export class BudgetSummaryMother {
  static crear(override: Partial<BudgetSummary> = {}): BudgetSummary {
    return {
      period: 'MENSUAL',
      spent: 500,
      limit: 2000,
      ...override,
    };
  }
}

export class HealthSummaryMother {
  static crear(override: Partial<HealthSummary> = {}): HealthSummary {
    return {
      rewardLevel: 'Nivel 2',
      rewardPoints: 150,
      pointsToNextLevel: 50,
      weeklyHealthSummary: 'Buen ritmo esta semana',
      ...override,
    };
  }
}

export class ScheduledPickupMother {
  static crear(override: Partial<ScheduledPickup> = {}): ScheduledPickup {
    return {
      id: 'pickup-1',
      menuName: 'Almuerzo saludable',
      pickupTime: 'Mediodía (12:00-13:00)',
      ...override,
    };
  }
}

export class TransactionSummaryMother {
  static crear(override: Partial<TransactionSummary> = {}): TransactionSummary {
    return {
      id: 'tx-1',
      name: 'Compra Buffet',
      date: new Date('2026-07-03'),
      amount: -500,
      icon: 'fa-shopping-bag',
      ...override,
    };
  }
}

export class SmartActionMother {
  static crear(override: Partial<SmartAction> = {}): SmartAction {
    return {
      title: 'Reforzá el saldo',
      description: 'Se le está por acabar la plata',
      actionType: 'TRANSFER',
      actionPayload: '{}',
      ...override,
    };
  }
}

export class ChildDashboardSummaryMother {
  static crear(override: Partial<ChildDashboardSummary> = {}): ChildDashboardSummary {
    return {
      studentId: STUDENT_ID_TEST,
      studentName: 'Julián García',
      balance: 1500,
      debt: 0,
      urlFotoPerfil: null,
      spendingPredictionMessage: 'Le queda saldo para toda la semana',
      budget: BudgetSummaryMother.crear(),
      health: HealthSummaryMother.crear(),
      todayPickups: [ScheduledPickupMother.crear()],
      recentTransactions: [TransactionSummaryMother.crear()],
      ...override,
    };
  }

  static crearVarios(): ChildDashboardSummary[] {
    return [
      ChildDashboardSummaryMother.crear(),
      ChildDashboardSummaryMother.crear({
        studentId: 'student-2',
        studentName: 'Ana García',
        balance: 800,
      }),
    ];
  }
}

export class TutorGlobalDashboardSummaryMother {
  static crear(override: Partial<TutorGlobalDashboardSummary> = {}): TutorGlobalDashboardSummary {
    return {
      tutorId: TUTOR_ID_TEST,
      totalBalance: 2300,
      totalDebt: 0,
      children: ChildDashboardSummaryMother.crearVarios(),
      plan: 'AVANZADO',
      ...override,
    };
  }

  static crearConConfig(dashboardItems: unknown[]): TutorGlobalDashboardSummary {
    return TutorGlobalDashboardSummaryMother.crear({
      dashboardConfig: JSON.stringify(dashboardItems),
    });
  }
}
