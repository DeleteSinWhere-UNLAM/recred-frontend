import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  public updateAvailable = signal<boolean>(false);

  constructor(private swUpdate: SwUpdate) {
    this.checkForUpdates();
  }

  private checkForUpdates() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable.set(true);
      });
  }
  public applyUpdate() {
    window.location.reload();
  }
}
