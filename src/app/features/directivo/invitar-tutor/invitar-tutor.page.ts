import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { InvitarTutorPresenter } from './presenter/invitar-tutor.presenter';

type InvitarTutorForm = FormGroup<{
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  phone: FormControl<string>;
}>;

@Component({
  selector: 'app-invitar-tutor-page',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  templateUrl: './invitar-tutor.page.html',
  styleUrl: './invitar-tutor.page.css',
  providers: [InvitarTutorPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitarTutorPage {
  protected readonly presenter = inject(InvitarTutorPresenter);

  protected readonly form: InvitarTutorForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.form.invalid || this.presenter.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, firstName, lastName, phone } = this.form.getRawValue();
    await this.presenter.invitar({
      email: email.trim().toLowerCase(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  }

  protected invitarOtro(): void {
    this.presenter.limpiarResultado();
    this.form.reset({ email: '', firstName: '', lastName: '', phone: '' });
  }
}
