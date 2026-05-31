import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingCtaButtonComponent } from './components/landing-cta-button/landing-cta-button.component';
import { CtaLanding } from './models/cta-landing.model';
import { LandingPresenter } from './presenter/landing.presenter';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.css',
  imports: [LandingCtaButtonComponent],
  providers: [LandingPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  protected readonly presenter = inject(LandingPresenter);

  protected onCtaClick(cta: CtaLanding): void {
    this.presenter.navegar(cta);
  }

  protected onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.endsWith(IMAGEN_FALLBACK)) return;
    img.src = IMAGEN_FALLBACK;
  }
}

const IMAGEN_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 540'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='#E8EDF3'/>
          <stop offset='1' stop-color='#F0F4F8'/>
        </linearGradient>
      </defs>
      <rect width='480' height='540' fill='url(#g)'/>
      <g transform='translate(140 180)' fill='#94A3B8'>
        <circle cx='40' cy='40' r='32'/>
        <rect x='90' y='10' width='110' height='60' rx='12'/>
        <rect x='30' y='100' width='170' height='50' rx='10' fill='#4A6FA5' opacity='0.25'/>
      </g>
      <text x='240' y='420' text-anchor='middle' font-family='Inter, sans-serif' font-size='16' font-weight='600' fill='#94A3B8'>
        Imagen del buffet
      </text>
    </svg>`,
  );
