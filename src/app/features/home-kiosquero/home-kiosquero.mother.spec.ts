import {
  PanelKiosqueroActivityMother,
  PanelKiosqueroMother,
} from './home-kiosquero.mother';

describe('HomeKiosquero mothers extra', () => {
  it('PanelKiosqueroActivityMother.crearVacia deberia devolver todas las listas vacias', () => {
    const activity = PanelKiosqueroActivityMother.crearVacia();

    expect(activity.salesByTimeSlot).toEqual([]);
    expect(activity.salesByCategory).toEqual([]);
    expect(activity.ordersByStatus).toEqual([]);
    expect(activity.ordersByPurchaseType).toEqual([]);
  });

  it('PanelKiosqueroMother.crearVacio deberia devolver un panel con totales en 0', () => {
    const panel = PanelKiosqueroMother.crearVacio();

    expect(panel.summary.totalSold).toBe(0);
    expect(panel.summary.totalOrders).toBe(0);
    expect(panel.activity.salesByCategory).toEqual([]);
  });
});
