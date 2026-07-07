import { Injectable } from '@angular/core';

const STORAGE_KEY = 'invitacionTutorToken';

@Injectable({ providedIn: 'root' })
export class InvitacionTokenStorageService {
  guardar(token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, token);
  }

  leer(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  }

  limpiar(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}
