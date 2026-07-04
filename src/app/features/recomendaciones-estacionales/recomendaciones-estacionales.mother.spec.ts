import { PromocionCreadaMother } from './recomendaciones-estacionales.mother';

describe('PromocionCreadaMother', () => {
  it('crear deberia devolver la promocion default', () => {
    const promo = PromocionCreadaMother.crear();

    expect(promo.id).toBe('promo-1');
    expect(promo.status).toBe('ACTIVE');
    expect(promo.discountPercentage).toBe(20);
  });

  it('crear con override deberia mergear', () => {
    const promo = PromocionCreadaMother.crear({ status: 'DRAFT' });

    expect(promo.status).toBe('DRAFT');
    expect(promo.id).toBe('promo-1');
  });
});
