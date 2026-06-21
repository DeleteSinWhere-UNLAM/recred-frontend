import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: PlanFeature[];
  isHighlighted?: boolean;
}

@Component({
  selector: 'app-pricing-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing-plans.component.html',
  styleUrls: ['./pricing-plans.component.css']
})
export class PricingPlansComponent {
  userType = input<'padre' | 'kiosquero'>('padre');

  // Estado del Toggle Global
  isAnnualGlobal = signal<boolean>(false);

  plans = computed<PricingPlan[]>(() => {
    const basicFeatures = [
      'Funciones esenciales',
      'Soporte general',
      'Notificaciones'
    ];

    const premiumFeatures = this.userType() === 'padre'
      ? [
        'Inteligencia artificial',
        'Panel de control',
        'Promociones exclusivas',
        'Notificaciones personalizadas'
      ]
      : [
        'Inteligencia artificial',
        'Panel de control',
        'Carga de stock masiva',
        'Control de stock inteligente',
        'Estrategias de venta personalizables'
      ];

    const allFeaturesNames = [...basicFeatures, ...premiumFeatures];

    const makeFeatures = (includedCount: number): PlanFeature[] => {
      return allFeaturesNames.map((name, index) => ({
        name,
        included: index < includedCount
      }));
    };

    return [
      {
        id: 'basico',
        name: 'Suscripción Básico',
        priceMonthly: 0,
        priceAnnual: 0,
        description: 'Ideal para comenzar y conocer la plataforma.',
        features: makeFeatures(3),
        isHighlighted: false
      },
      {
        id: 'intermedio',
        name: 'Suscripción Intermedio',
        priceMonthly: 5500,
        priceAnnual: 5500 * 12 * 0.8,
        description: 'Flexibilidad total para comenzar a crecer.',
        features: makeFeatures(5),
        isHighlighted: true
      },
      {
        id: 'avanzado',
        name: 'Suscripción Avanzado',
        priceMonthly: 10200,
        priceAnnual: 10200 * 12 * 0.8,
        description: 'Nuestra oferta completa con todas las herramientas.',
        features: makeFeatures(allFeaturesNames.length),
        isHighlighted: false
      }
    ];
  });

  toggleGlobalPeriod() {
    this.isAnnualGlobal.update(val => !val);
  }

  selectPlan(planId: string) {
    console.log('Plan seleccionado:', planId, '| Usuario:', this.userType());
  }
}
