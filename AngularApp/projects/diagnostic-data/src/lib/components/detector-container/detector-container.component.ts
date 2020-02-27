import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { DetectorResponse, RenderingType } from '../../models/detector';
import { BehaviorSubject } from 'rxjs';
//import { VersionTestService } from 'projects/app-service-diagnostics/src/app/fabric-ui/version-test.service';

@Component({
  selector: 'detector-container',
  templateUrl: './detector-container.component.html',
  styleUrls: ['./detector-container.component.scss']
})
export class DetectorContainerComponent implements OnInit {

  detectorResponse: DetectorResponse = null;
  error: any;
  @Input() hideDetectorControl: boolean = false;
  hideTimerPicker: boolean = false;

   detectorName: string;

  @Input() detectorSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  @Input() set detector(detector: string) {
    this.detectorSubject.next(detector);
  }

  @Input() analysisMode:boolean = false;
  @Input() isAnalysisView:boolean = false;
  isCategoryOverview:boolean = false;
  private isLegacy:boolean
  constructor(private _route: ActivatedRoute, private _diagnosticService: DiagnosticService,
    public detectorControlService: DetectorControlService) { }

  ngOnInit() {
    this.isLegacy = true;//this.versionTestService.getIsLegcy();
    //Remove after A/B Test
    if (this.isLegacy) {
      this.hideTimerPicker = false;
    } else {
      this.hideTimerPicker= this.hideDetectorControl || this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === "categories") > -1;
    }
    
    this.detectorControlService.update.subscribe(isValidUpdate => {
      if (isValidUpdate && this.detectorName) {
        this.refresh();
      }
    });

    this.detectorSubject.subscribe(detector => {
      if (detector && detector !== "searchResultsAnalysis") {
        this.detectorName = detector;
        this.refresh();
      }
    });

    const component:any = this._route.component; 
    if (component && component.name) {
      this.isCategoryOverview = component.name === "CategoryOverviewComponent";
    }
  }

  refresh() {
    this.error = null;
    this.detectorResponse = null;
    this.getDetectorResponse();
  }

  getDetectorResponse() {
    this._diagnosticService.getDetector(this.detectorName, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
      this.detectorControlService.shouldRefresh,  this.detectorControlService.isInternalView)
      .subscribe((response: DetectorResponse) => {
       // this.shouldHideTimePicker(response);
        this.detectorResponse = response;
      }, (error: any) => {
        this.error = error;
      });
  }

  // TODO: Right now this is hardcoded to hide for cards, but make this configurable from backend
  // shouldHideTimePicker(response: DetectorResponse) {
  //   if (response && response.dataset && response.dataset.length > 0) {
  //     const cardRenderingIndex = response.dataset.findIndex(data => data.renderingProperties.type == RenderingType.Cards);

  //     //Remove after A/B Test
  //     if (this.isLegacy) {
  //       this.hideDetectorControl = cardRenderingIndex >= 0;
  //     } else {
  //       this.hideDetectorControl = cardRenderingIndex >= 0 || this.hideDetectorControl;
  //     }
      
  //   }
  // }
}
