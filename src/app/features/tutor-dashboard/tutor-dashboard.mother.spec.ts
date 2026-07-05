import { SmartActionMother } from './tutor-dashboard.mother';

describe('SmartActionMother', () => {
  it('crear deberia devolver la accion default', () => {
    const accion = SmartActionMother.crear();

    expect(accion.title).toBe('Reforzá el saldo');
    expect(accion.actionType).toBe('TRANSFER');
  });

  it('crear con override deberia mergear', () => {
    const accion = SmartActionMother.crear({ actionType: 'SEND_NOTIFICATION' });

    expect(accion.actionType).toBe('SEND_NOTIFICATION');
    expect(accion.title).toBe('Reforzá el saldo');
  });
});
