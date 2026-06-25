import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartChartWidget } from './smart-chart-widget';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

describe('SmartChartWidget', () => {
  let component: SmartChartWidget;
  let fixture: ComponentFixture<SmartChartWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartChartWidget],
      providers: [
        provideCharts(withDefaultRegisterables())
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartChartWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
