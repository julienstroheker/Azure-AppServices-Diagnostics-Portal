import { DiagnosticService } from 'diagnostic-data';
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable()
export class TabTitleResolver implements Resolve<Observable<string>> {
  constructor(private _diagnosticService: DiagnosticService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string> {
    if (!route.data['navigationTitle']) {
        const detectorId = route.params['detectorName'];
        return this._diagnosticService.getDetectors().pipe(map(detectors => {
          return this._diagnosticService.getDetectorById(detectorId).name;
        }));
    }

    return of('Tab');
  }
}
