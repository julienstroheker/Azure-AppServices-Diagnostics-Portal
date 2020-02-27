import { Moment } from 'moment';
import { BehaviorSubject } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DetectorResponse, Rendering, RenderingType } from '../../models/detector';
import { DetectorControlService } from '../../services/detector-control.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { CompilationProperties} from '../../models/compilation-properties';
import {GenericSupportTopicService} from '../../services/generic-support-topic.service';
import { ActivatedRoute, UrlSegment } from '@angular/router';
//import { VersionTestService } from 'projects/app-service-diagnostics/src/app/fabric-ui/version-test.service';

@Component({
  selector: 'detector-view',
  templateUrl: './detector-view.component.html',
  styleUrls: ['./detector-view.component.scss'],
  animations: [
    trigger('expand', [
      state('hidden', style({ height: '0px' })),
      state('shown', style({ height: '*' })),
      transition('* => *', animate('.25s')),
      transition('void => *', animate(0))
    ])
  ]
})
export class DetectorViewComponent implements OnInit {

  detectorDataLocalCopy: DetectorResponse;
  errorState: any;
  isPublic: boolean;

  supportDocumentContent: string = "";
  supportDocumentRendered: boolean = false;


  buttonViewVisible: boolean = false;
  buttonViewActiveComponent: string;

  readonly Feedback: string = 'Feedback';
  readonly Report: string = 'Report';

  private detectorResponseSubject: BehaviorSubject<DetectorResponse> = new BehaviorSubject<DetectorResponse>(null);
  private errorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  detectorEventProperties: { [name: string]: string };
  ratingEventProperties: { [name: string]: string };
  authorEmails: string;
  insightsListEventProperties = {};

  emailToAuthor: string = '';
  emailToApplensTeam: string = '';

  @Input()
  set detectorResponse(value: DetectorResponse) {
    this.detectorResponseSubject.next(value);
  }

  @Input()
  set error(value: any) {
    this.errorSubject.next(value);
  }

  @Input() startTime: Moment;
  @Input() endTime: Moment;
  @Input() showEdit: boolean = true;
  @Input() insideDetectorList: boolean = false;
  @Input() parentDetectorId: string = '';
  @Input() isSystemInvoker: boolean = false;
  @Input() authorInfo: string = '';
  @Input() feedbackDetector: string = '';
  @Input() developmentMode: boolean = false;
  @Input() script: string = '';
  @Input() detector: string = '';
  @Input() compilationPackage: CompilationProperties;
  @Input() analysisMode: boolean = false;
  @Input() isAnalysisView: boolean = false;
  @Input() hideDetectorHeader: boolean = false;
  @Input() isCategoryOverview:boolean = false;
  feedbackButtonLabel: string = 'Send Feedback';
  hideDetectorControl: boolean = false;
  private isLegacy:boolean;
  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private telemetryService: TelemetryService,
    private detectorControlService: DetectorControlService, private _supportTopicService: GenericSupportTopicService, protected _route: ActivatedRoute) {
    this.isPublic = config && config.isPublic;
    this.feedbackButtonLabel = this.isPublic ? 'Send Feedback' : 'Rate Detector';
  }

  ngOnInit() {
    this.isLegacy = true;//this.versionTestService.getIsLegcy();
    this.loadDetector();
    this.errorSubject.subscribe((data: any) => {
      this.errorState = data;
    });

    // If it is using the new route, don't show those buttons
    // this.hideDetectorControl = this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === 'categories') > -1;
    //Remove after A/B Test
    if (this.isLegacy) {
      this.hideDetectorControl = false;
    } else {
      this.hideDetectorControl = this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === 'categories') > -1;
    }

    // The detector name can be retrieved from  url column of application insight resource pageviews table.
    if (!this.insideDetectorList) {
      this.telemetryService.logPageView(TelemetryEventNames.DetectorViewLoaded, { "detectorId": this.detector });
    }
  }

  protected loadDetector() {
    this.detectorResponseSubject.subscribe((data: DetectorResponse) => {
      this.detectorDataLocalCopy = data;
      if (data) {
        this.detectorEventProperties = {
          'StartTime': String(this.startTime),
          'EndTime': String(this.endTime),
          'DetectorId': data.metadata.id,
          'ParentDetectorId': this.parentDetectorId,
          'Url': window.location.href
        };

        if (data.metadata.supportTopicList && data.metadata.supportTopicList.findIndex(supportTopic => supportTopic.id === this._supportTopicService.supportTopicId) >= 0){
          this.populateSupportTopicDocument();
        }

        this.ratingEventProperties = {
          'DetectorId': data.metadata.id,
          'Url': window.location.href
        };

        this.feedbackDetector = this.isSystemInvoker ? this.feedbackDetector : data.metadata.id;
        let subject = encodeURIComponent(`Detector Feedback for ${this.feedbackDetector}`);
        let body = encodeURIComponent('Current site: ' + window.location.href + '\n' + 'Please provide feedback here:');
        this.emailToApplensTeam = `mailto:applensdisc@microsoft.com?subject=${subject}&body=${body}`;

        if (!this.isSystemInvoker && data.metadata && data.metadata.author) {
          this.authorInfo = data.metadata.author;
        }

        if (this.authorInfo !== '') {
          const separators = [' ', ',', ';', ':'];
          const authors = this.authorInfo.split(new RegExp(separators.join('|'), 'g'));
          const authorsArray: string[] = [];
          authors.forEach(author => {
            if (author && author.length > 0) {
              authorsArray.push(`${author}@microsoft.com`);
            }
          });
          this.authorEmails = authorsArray.join(';');
          this.emailToAuthor = `mailto:${this.authorEmails}?cc=applensdisc@microsoft.com&subject=${subject}&body=${body}`;
        }

        this.buttonViewActiveComponent = null;
        this.buttonViewVisible = false;

        this.logInsights(data);

        // this.hideDetectorHeader = data.dataset.findIndex(set => (<Rendering>set.renderingProperties).type === RenderingType.Cards) >= 0;
      }
    });
    console.log("local copy and error state", this.detectorDataLocalCopy, this.errorState);
  }

  toggleButtonView(feature: string) {
    if (this.buttonViewVisible) {
      this.buttonViewVisible = false;
      if (this.buttonViewActiveComponent !== feature) {
        setTimeout(() => {
          this.buttonViewActiveComponent = feature;
          this.buttonViewVisible = true;
        }, 250);
      } else {
        setTimeout(() => {
          this.buttonViewActiveComponent = null;
        }, 250);
      }
    } else {
      this.buttonViewActiveComponent = feature;
      this.buttonViewVisible = true;
    }
  }

  protected logInsights(data: DetectorResponse) {
    if (data.dataset) {
      let totalCount: number = 0;
      let successCount: number = 0;
      let criticalCount: number = 0;
      let warningCount: number = 0;
      let infoCount: number = 0;
      let defaultCount: number = 0;
      const insightsList = [];
      const insightsNameList: string[] = [];

      const statusColumnIndex = 0;
      const insightColumnIndex = 1;
      const isExpandedIndex = 4;

      data.dataset.forEach(dataset => {
        if (dataset.renderingProperties && dataset.renderingProperties.type === RenderingType.Insights) {
          dataset.table.rows.forEach(row => {
            if ((insightsNameList.find(insightName => insightName === row[insightColumnIndex])) == null) {
              {
                const isExpanded: boolean = row.length > isExpandedIndex ? row[isExpandedIndex].toLowerCase() === 'true' : false;
                const insightInstance = {
                  'Name': row[insightColumnIndex],
                  'Status': row[statusColumnIndex],
                  'IsExpandedByDefault': isExpanded
                };
                insightsList.push(insightInstance);
                insightsNameList.push(row[insightColumnIndex]);

                switch (row[statusColumnIndex]) {
                  case 'Critical':
                    criticalCount++;
                    break;
                  case 'Warning':
                    warningCount++;
                    break;
                  case 'Success':
                    successCount++;
                    break;
                  case 'Info':
                    infoCount++;
                    break;
                  default:
                    defaultCount++;
                }
              }
            }
          });
        }
      });

      totalCount = insightsList.length;

      const insightSummary = {
        'Total': totalCount,
        'Critical': criticalCount,
        'Warning': warningCount,
        'Success': successCount,
        'Info': infoCount,
        'Default': defaultCount
      };

      this.insightsListEventProperties = {
        'InsightsList': JSON.stringify(insightsList),
        'InsightsSummary': JSON.stringify(insightSummary)
      };

      this.logEvent(TelemetryEventNames.InsightsSummary, this.insightsListEventProperties);
    }
  }


  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.detectorEventProperties)) {
      if (this.detectorEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.detectorEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  populateSupportTopicDocument(){
    if (!this.supportDocumentRendered){
      this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
        if (res && res.json() && res.json().length>0){
          var htmlContent = res.json()[0]["htmlContent"];
          // Custom javascript code to remove top header from support document html string
          var tmp = document.createElement("DIV");
          tmp.innerHTML = htmlContent;
          var h2s = tmp.getElementsByTagName("h2");
          if (h2s && h2s.length>0){
            h2s[0].remove();
          }

          // Set the innter html for support document display
          this.supportDocumentContent = tmp.innerHTML;
          this.supportDocumentRendered = true;
        }
      });
    }
  }

}
