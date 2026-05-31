import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CtaLanding } from '../../models/cta-landing.model';

@Component({
  selector: 'app-landing-cta-button',
  templateUrl: './landing-cta-button.component.html',
  styleUrl: './landing-cta-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingCtaButtonComponent {
  @Input({ required: true }) cta!: CtaLanding;
  @Output() clicked = new EventEmitter<void>();
}
