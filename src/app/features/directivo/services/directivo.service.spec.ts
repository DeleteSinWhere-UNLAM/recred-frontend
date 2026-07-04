import { TestBed } from '@angular/core/testing';
import { DirectivoService } from './directivo.service';

describe('DirectivoService', () => {
  let service: DirectivoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectivoService);
  });

  it('debería crearse correctamente', () => {
    thenSeCreaCorrectamente();
  });

  function thenSeCreaCorrectamente(): void {
    expect(service).toBeTruthy();
  }
});
