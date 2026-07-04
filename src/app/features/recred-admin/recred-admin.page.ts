import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RecredAdminPresenter } from './presenter/recred-admin.presenter';

@Component({
  selector: 'app-recred-admin-page',
  standalone: true,
  templateUrl: './recred-admin.page.html',
  styleUrl: './recred-admin.page.css',
  imports: [AsyncPipe, DatePipe],
  providers: [RecredAdminPresenter],
  host: { style: 'display: block; min-height: 100vh; background: #0a0f1a;' },
})
export class RecredAdminPage implements OnInit {
  readonly presenter = inject(RecredAdminPresenter);

  ngOnInit(): void {
    this.presenter.initialize();
  }
}
