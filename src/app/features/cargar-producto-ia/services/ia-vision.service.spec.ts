import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IaVisionService } from './ia-vision.service';

describe('IaVisionService', () => {
  let service: IaVisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(IaVisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
