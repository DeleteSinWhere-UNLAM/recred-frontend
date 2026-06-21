import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
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

  plans = computed<PricingPlan[]>(() => {
    const isPadre = this.userType() === 'padre';

    const basicFeatures = [
      'Funciones esenciales',
      'Soporte general',
      'Notificaciones'
    ];

    const premiumFeatures = isPadre
      ? [
        'Inteligencia artificial',
        'Acceso a datos de alto valor',
        'Promociones exclusivas',
        'Notificaciones personalizadas'
      ]
      : [
        'Inteligencia artificial',
        'Acceso a datos de alto valor',
        'Carga de stock masiva',
        'Control de stock inteligente',
        'Estrategias de venta personalizable'
      ];

    return [
      {
        id: 'basic',
        name: 'Plan Básico',
        price: 0,
        period: 'gratis por siempre',
        description: 'Ideal para comenzar y conocer la plataforma.',
        features: [...basicFeatures],
        isHighlighted: false
      },
      {
        id: 'premium-monthly',
        name: 'Premium Mensual',
        price: 15,
        period: 'por mes',
        description: 'Flexibilidad total para comenzar a crecer.',
        features: [...basicFeatures, ...premiumFeatures.slice(0, 1)],
        isHighlighted: false
      },
      {
        id: 'premium-quarterly',
        name: 'Premium Trimestral',
        price: 35,
        period: 'cada 3 meses',
        description: 'Paga cada 3 meses y ahorra un 22%.',
        features: [...basicFeatures, ...premiumFeatures.slice(0, 2)],
        isHighlighted: false
      },
      {
        id: 'premium-annual',
        name: 'Premium Anual',
        price: 120,
        period: 'por año',
        description: 'Nuestra mejor oferta. Ahorra un 33%.',
        features: [...basicFeatures, ...premiumFeatures],
        isHighlighted: true
      }
    ];
  });

  selectPlan(planId: string) {
    console.log('Plan seleccionado:', planId, '| Usuario:', this.userType());
    // Aquí a futuro se puede emitir un evento o conectar al servicio de pagos del backend
  }
}
