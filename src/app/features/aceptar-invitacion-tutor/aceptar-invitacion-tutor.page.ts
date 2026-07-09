import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AceptarInvitacionTutorPresenter } from './presenter/aceptar-invitacion-tutor.presenter';

@Component({
  selector: 'app-aceptar-invitacion-tutor-page',
  standalone: true,
  imports: [],
  templateUrl: './aceptar-invitacion-tutor.page.html',
  styleUrl: './aceptar-invitacion-tutor.page.css',
  providers: [AceptarInvitacionTutorPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AceptarInvitacionTutorPage implements OnInit {
  protected readonly presenter = inject(AceptarInvitacionTutorPresenter);
  private readonly route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');
    await this.presenter.validar(token);
  }

  protected async onIniciarLogin(username?: string): Promise<void> {
    await this.presenter.iniciarLogin(username);
  }
}
