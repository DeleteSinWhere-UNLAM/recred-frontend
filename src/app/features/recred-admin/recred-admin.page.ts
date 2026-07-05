import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RecredAdminPresenter } from './presenter/recred-admin.presenter';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-recred-admin-page',
  standalone: true,
  templateUrl: './recred-admin.page.html',
  styleUrl: './recred-admin.page.css',
  imports: [AsyncPipe, DatePipe, NavbarComponent],
  providers: [RecredAdminPresenter],
})
export class RecredAdminPage implements OnInit {
  readonly presenter = inject(RecredAdminPresenter);

  ngOnInit(): void {
    this.presenter.initialize();
  }
}
