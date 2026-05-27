import { TestBed } from '@angular/core/testing';

import { AiVisionService } from './ai-vision-service';

describe('AiVisionService', () => {
  let service: AiVisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiVisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
