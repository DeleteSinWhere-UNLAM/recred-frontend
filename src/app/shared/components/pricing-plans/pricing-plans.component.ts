import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  PeriodoSuscripcion,
  PlanSuscripcionUsuario,
  SubscriptionPaymentService,
} from '../../../data-access/services/suscripciones/subscription-payment.service';
import { ToastService } from '../../services/toast.service';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export type PricingPlanId = 'basico' | 'intermedio' | 'avanzado';
type PlanActualSuscripcion = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';

export interface PricingPlan {
  id: PricingPlanId;
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
  private readonly perfilService = inject(PerfilService);
  private readonly subscriptionPaymentService = inject(SubscriptionPaymentService);
  private readonly toastService = inject(ToastService);

  userType = input<'padre' | 'kiosquero'>('padre');

  // Estado del Toggle Global
  isAnnualGlobal = signal<boolean>(false);
  planEnCompra = signal<PricingPlanId | null>(null);
  errorCompra = signal<string | null>(null);

  planActual = computed<PlanActualSuscripcion>(() => {
    const plan = this.perfilService.perfil()?.plan?.toUpperCase();
    if (plan === 'INTERMEDIO' || plan === 'AVANZADO') return plan;
    return 'GRATUITO';
  });

  planActualLabel = computed(() => {
    const plan = this.planActual();
    if (plan === 'INTERMEDIO') return 'Intermedio';
    if (plan === 'AVANZADO') return 'Avanzado';
    return 'Gratuito';
  });

  plans = computed<PricingPlan[]>(() => {
    const basicFeatures = [
      'Funciones esenciales',
      'Soporte general',
      'Notificaciones'
    ];

    const paidFeatures = this.userType() === 'padre'
      ? [
        'Inteligencia artificial',
        'Panel de control',
        'Promociones exclusivas',
        'Notificaciones personalizadas'
      ]
      : [
        'Chatbot',
        'Panel de control',
        'Carga de producto con imagen',
        'Carga de stock masiva',
        'Diagnostico comercial',
        'Promociones'
      ];

    const allFeaturesNames = [...basicFeatures, ...paidFeatures];
    const intermedioIncluidas = this.userType() === 'padre'
      ? 5
      : basicFeatures.length + 3;

    const makeFeatures = (includedCount: number): PlanFeature[] => {
      return allFeaturesNames.map((name, index) => ({
        name,
        included: index < includedCount
      }));
    };

    return [
      {
        id: 'basico',
        name: 'Básico',
        priceMonthly: 0,
        priceAnnual: 0,
        description: 'Ideal para comenzar y conocer la plataforma.',
        features: makeFeatures(3),
        isHighlighted: false
      },
      {
        id: 'intermedio',
        name: 'Intermedio',
        priceMonthly: 5500,
        priceAnnual: 5500 * 12 * 0.8,
        description: 'Flexibilidad total para comenzar a crecer.',
        features: makeFeatures(intermedioIncluidas),
        isHighlighted: true
      },
      {
        id: 'avanzado',
        name: 'Avanzado',
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

  async selectPlan(planId: PricingPlanId): Promise<void> {
    const plan = this.obtenerPlanBackend(planId);
    if (!plan || this.planEnCompra() || this.planNoComprable(planId)) return;

    this.planEnCompra.set(planId);
    this.errorCompra.set(null);

    try {
      const usuarioId = await this.obtenerUsuarioId();
      if (!usuarioId) {
        throw new Error('No se encontro el ID del usuario.');
      }

      const respuesta = await this.subscriptionPaymentService.crearSuscripcionUsuario({
        usuarioId,
        plan,
        periodo: this.periodoSeleccionado(),
      });

      if (!respuesta.paymentUrl) {
        throw new Error('El backend no devolvio una URL de pago.');
      }

      this.redirigirAPago(respuesta.paymentUrl);
    } catch (err) {
      console.error('Error creando la suscripcion:', err);
      this.errorCompra.set('No pudimos iniciar el pago. Intenta de nuevo.');
      this.toastService.mostrar('No pudimos iniciar el pago.', 'error');
    } finally {
      this.planEnCompra.set(null);
    }
  }

  private periodoSeleccionado(): PeriodoSuscripcion {
    return this.isAnnualGlobal() ? 'ANUAL' : 'MENSUAL';
  }

  private obtenerPlanBackend(planId: PricingPlanId): PlanSuscripcionUsuario | null {
    if (planId === 'intermedio') return 'INTERMEDIO';
    if (planId === 'avanzado') return 'AVANZADO';
    return null;
  }

  planNoComprable(planId: PricingPlanId): boolean {
    if (planId === 'basico') return true;
    return this.nivelPlanId(planId) <= this.nivelPlanActual(this.planActual());
  }

  esPlanActual(planId: PricingPlanId): boolean {
    return this.normalizarPlanId(this.planActual()) === planId;
  }

  textoBoton(planId: PricingPlanId): string {
    if (this.planEnCompra() === planId) return 'Redirigiendo...';
    if (this.esPlanActual(planId)) return 'Plan actual';
    if (this.planNoComprable(planId)) return 'Incluido';
    if (this.nivelPlanActual(this.planActual()) > 0) return 'Mejorar plan';
    return 'Comprar plan';
  }

  private normalizarPlanId(plan: PlanActualSuscripcion): PricingPlanId {
    if (plan === 'INTERMEDIO') return 'intermedio';
    if (plan === 'AVANZADO') return 'avanzado';
    return 'basico';
  }

  private nivelPlanId(planId: PricingPlanId): number {
    if (planId === 'avanzado') return 2;
    if (planId === 'intermedio') return 1;
    return 0;
  }

  private nivelPlanActual(plan: PlanActualSuscripcion): number {
    if (plan === 'AVANZADO') return 2;
    if (plan === 'INTERMEDIO') return 1;
    return 0;
  }

  private async obtenerUsuarioId(): Promise<string | null> {
    const perfil = this.perfilService.perfil() ?? await this.perfilService.asegurarPerfil();
    return perfil?.id?.trim() || null;
  }

  private redirigirAPago(url: string): void {
    window.location.href = url;
  }
}
