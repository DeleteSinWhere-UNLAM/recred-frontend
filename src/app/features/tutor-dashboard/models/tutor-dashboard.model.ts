export interface TutorGlobalDashboardSummary {
  tutorId: string;
  totalBalance: number;
  children: ChildDashboardSummary[];
}

export interface ChildDashboardSummary {
  studentId: string;
  studentName: string;
  balance: number;
  spendingPredictionMessage: string;
  budget?: BudgetSummary;
  health: HealthSummary;
  todayPickups: ScheduledPickup[];
  recentTransactions: TransactionSummary[];
  smartAction?: SmartAction;
}

export interface BudgetSummary {
  period: string;
  spent: number;
  limit: number;
}

export interface HealthSummary {
  rewardLevel: string;
  rewardPoints: number;
  pointsToNextLevel: number;
  weeklyHealthSummary: string;
}

export interface ScheduledPickup {
  id: string;
  menuName: string;
  pickupTime: string;
}

export interface TransactionSummary {
  id: string;
  name: string;
  date: Date;
  amount: number;
  icon: string;
}

export interface SmartAction {
  title: string;
  description: string;
  actionType: string;
  actionPayload: string;
}
