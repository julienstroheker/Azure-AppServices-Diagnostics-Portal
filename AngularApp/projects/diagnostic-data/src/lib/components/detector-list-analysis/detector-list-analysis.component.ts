import { Moment } from 'moment';
import { v4 as uuid } from 'uuid';
import { Component, OnInit, Input, Inject, EventEmitter, Output } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { LoadingStatus } from '../../models/loading';
import { StatusStyles } from '../../models/styles';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Solution } from '../solution/solution';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { forkJoin as observableForkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DetectorResponse, DetectorMetaData, HealthStatus, DetectorType } from '../../models/detector';
import { Insight, InsightUtils } from '../../models/insight';
import { DataTableResponseColumn, DataTableResponseObject, DiagnosticData, RenderingType, Rendering, TimeSeriesType, TimeSeriesRendering } from '../../models/detector';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppInsightQueryMetadata, AppInsightData, BladeInfo } from '../../models/app-insights';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import { SearchAnalysisMode } from '../../models/search-mode';
//  import { GenieService } from '../../../../../app-service-diagnostics/';
import { GenieGlobals } from '../../services/genie.service';

@Component({
    selector: 'detector-list-analysis',
    templateUrl: './detector-list-analysis.component.html',
    styleUrls: ['./detector-list-analysis.component.scss'],
    animations: [
        trigger(
            'loadingAnimation',
            [
                state('shown', style({
                    opacity: 1
                })),
                state('hidden', style({
                    opacity: 0
                })),
                transition('* => *', animate('.3s'))
            ]
        )
    ]
})
export class DetectorListAnalysisComponent extends DataRenderBaseComponent implements OnInit {
    @Input() analysisId: string;
    @Input() searchMode: SearchAnalysisMode = SearchAnalysisMode.CaseSubmission;
    @Input() renderingOnlyMode: boolean = false;
    @Input() detectorViewModelsData: any;
    @Input() resourceId: string = "";
    @Input() targetedScore: number = 0;
    @Output() onComplete = new EventEmitter<any>();
    detectorViewModels: any[];
    detectorId: string;
    detectorName: string;
    contentHeight: string;
    detectors: any[] = [];
    LoadingStatus = LoadingStatus;
    issueDetectedViewModels: any[] = [];
    successfulViewModels: any[] = [];
    detectorMetaData: DetectorMetaData[];
    private childDetectorsEventProperties = {};
    loadingChildDetectors: boolean = false;
    appInsights: any;
    allSolutions: Solution[] = [];
    loadingMessages: string[] = [];
    loadingMessageIndex: number = 0;
    loadingMessageTimer: any;
    showLoadingMessage: boolean = false;
    startTime: Moment;
    endTime: Moment;
    renderingProperties: Rendering;
    isPublic: boolean;
    showAppInsightsSection: boolean = true;
    isAppInsightsEnabled: boolean = false;
    appInsightQueryMetaDataList: AppInsightQueryMetadata[] = [];
    appInsightDataList: AppInsightData[] = [];
    diagnosticDataSet: DiagnosticData[] = [];
    loadingAppInsightsResource: boolean = true;
    loadingAppInsightsQueryData: boolean = true;
    supportDocumentContent: string = "";
    supportDocumentRendered: boolean = false;
    @Input() searchTerm: string = "";
    searchId: string = null;
    showPreLoader: boolean = false;
    preLoadingErrorMessage: string = "Some error occurred while fetching diagnostics."
    showPreLoadingError: boolean = false;

    constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
        private _diagnosticService: DiagnosticService, private _detectorControl: DetectorControlService,
        protected telemetryService: TelemetryService, public _appInsightsService: AppInsightsQueryService,
        private _supportTopicService: GenericSupportTopicService, protected _globals: GenieGlobals,
        @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
        super(telemetryService);
        // this.isPublic = config && config.isPublic;

        // if (this.isPublic) {
        //     this._appInsightsService.CheckIfAppInsightsEnabled().subscribe(isAppinsightsEnabled => {
        //         this.isAppInsightsEnabled = isAppinsightsEnabled;
        //         this.loadingAppInsightsResource = false;
        //     });
        // }
    }

    @Input()
    detectorParmName: string;

    @Input()
    withinDiagnoseAndSolve: boolean = false;

    ngOnInit() {
        // if (this.renderingOnlyMode && this.detectorViewModelsData) {
        //   //  this.startRenderingFromInput();
        // }
        // else {
        //     if (this.analysisId === "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length > 0) {
        //         // Don't refresh genie
        //         this.refresh();
        //         console.log("calling refresh from nginit", this.searchTerm, this.searchMode);
        //     }
        //     else {
        //         console.log("waiting for update from detector control", this._detectorControl);
        //         this._detectorControl.update.subscribe(isValidUpdate => {
        //             if (isValidUpdate) {
        //                 this.refresh();
        //                 console.log("calling refresh from validupdate", this.searchTerm, this.searchMode);
        //             }
        //         });
        //     }

        // }

        this.startTime = this._detectorControl.startTime;
        this.endTime = this._detectorControl.endTime;
    }

    public getMetaDataMarkdown(metaData: AppInsightQueryMetadata) {
        let str = "<pre>" + metaData.query + "</pre>";
        return str;
    }

    getApplicationInsightsData(response: DetectorResponse) {
        this.appInsightQueryMetaDataList = [];
        this.appInsightDataList = [];

        let appInsightDiagnosticData = response.dataset.filter(data => (<Rendering>data.renderingProperties).type === RenderingType.ApplicationInsightsView);

        appInsightDiagnosticData.forEach((diagnosticData: DiagnosticData) => {
            diagnosticData.table.rows.map(row => {
                this.appInsightQueryMetaDataList.push(<AppInsightQueryMetadata>{
                    title: row[0],
                    description: row[1],
                    query: row[2],
                    poralBladeInfo: row[3],
                    renderingProperties: row[4]
                });
            });
        });

        if (this.isPublic && this.appInsightQueryMetaDataList !== []) {
            this._appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
                if (loadStatus === true) {
                    this.loadingAppInsightsResource = false;
                    this.appInsightQueryMetaDataList.forEach(appInsightData => {
                        this._appInsightsService.ExecuteQuerywithPostMethod(appInsightData.query).subscribe(data => {
                            if (data && data["Tables"]) {
                                let rows = data["Tables"][0]["Rows"];
                                let columns = data["Tables"][0]["Columns"];
                                let dataColumns: DataTableResponseColumn[] = [];
                                columns.forEach(column => {
                                    dataColumns.push(<DataTableResponseColumn>{
                                        columnName: column.ColumnName,
                                        dataType: column.DataType,
                                        columnType: column.ColumnType,
                                    })
                                });

                                this.appInsightDataList.push(<AppInsightData>{
                                    title: appInsightData.title,
                                    description: appInsightData.description,
                                    renderingProperties: appInsightData.renderingProperties,
                                    table: rows,
                                    poralBladeInfo: appInsightData.poralBladeInfo,
                                    diagnosticData: <DiagnosticData>{
                                        table: <DataTableResponseObject>{
                                            columns: dataColumns,
                                            rows: rows,
                                        },
                                        renderingProperties: appInsightData.renderingProperties,
                                    }
                                });
                            }

                            this.loadingAppInsightsQueryData = false;
                        });
                    });
                }
            });
        }
    }

    populateSupportTopicDocument() {
        if (!this.supportDocumentRendered) {
            this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
                if (res && res.json() && res.json().length > 0) {
                    var htmlContent = res.json()[0]["htmlContent"];
                    // Custom javascript code to remove top header from support document html string
                    var tmp = document.createElement("DIV");
                    tmp.innerHTML = htmlContent;
                    var h2s = tmp.getElementsByTagName("h2");
                    if (h2s && h2s.length > 0) {
                        h2s[0].remove();
                    }

                    // Set the innter html for support document display
                    this.supportDocumentContent = tmp.innerHTML;
                    this.supportDocumentRendered = true;
                }
            });
        }
    }

    startRenderingFromInput() {
        this.detectorViewModels = [];
        this.showPreLoader = false;
        this.showPreLoadingError = false;
        this.issueDetectedViewModels = [];
        console.log("****detector inputdata", this.detectorViewModelsData);
        this.detectors = this.detectorViewModelsData.detectors;
        this.issueDetectedViewModels = this.detectorViewModelsData.issueDetectedViewModels;
        this.successfulViewModels = this.detectorViewModelsData.successfulViewModels;
        let dataOutput = {};
        dataOutput["status"] = true;

        this.onComplete.emit(dataOutput);

        // this.detectorViewModels = this.detectorViewModelsData;
        // this.detectorViewModels.forEach((metaData, index) => {
        //   if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
        //     if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
        //       let insight = this.getDetectorInsight(this.detectorViewModels[index]);
        //       let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };
        //       this.issueDetectedViewModels.push(issueDetectedViewModel);
        //       this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => n1.model.status - n2.model.status);
        //     } else {
        //       let insight = this.getDetectorInsight(this.detectorViewModels[index]);
        //       let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };
        //       this.successfulViewModels.push(successViewModel);
        //     }
        //   }
        // });
    }

    refresh() {
        // console.log("calling refresh", this.searchTerm, this.searchMode);
        // if (this.analysisId === "searchResultsAnalysis" && this.searchMode === SearchAnalysisMode.Genie && this.searchTerm && this.searchTerm.length > 1) {
        //     this.detectorId = "";
        //     this.showAppInsightsSection = false;
        //     this.searchId = uuid();
        //     console.log("1. starting search task");
        //     let searchTask = this._diagnosticService.getDetectorsSearch(this.searchTerm).pipe(map((res) => res), catchError(e => of([])));
        //     let detectorsTask = this._diagnosticService.getDetectors().pipe(map((res) => res), catchError(e => of([])));
        //     console.log("search task and detectors task", searchTask, detectorsTask);
        //     this.showPreLoader = true;
        //     observableForkJoin([searchTask, detectorsTask]).subscribe(results => {
        //         this.showPreLoader = false;
        //         this.showPreLoadingError = false;
        //         var searchResults: DetectorMetaData[] = results[0];
        //         this.logEvent(TelemetryEventNames.SearchQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(searchResults.map((det: DetectorMetaData) => new Object({ id: det.id, score: det.score }))), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        //         var detectorList = results[1];
        //         console.log("search result and detectors result", searchResults, detectorList);
        //         if (detectorList) {
        //             searchResults.forEach(result => {
        //                 console.log("score:", result.score);
        //                 if (result.type === DetectorType.Detector) {
        //                     this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
        //                 }
        //                 else if (result.type === DetectorType.Analysis) {
        //                     var childList = this.getChildrenOfAnalysis(result.id, detectorList);
        //                     if (childList && childList.length > 0) {
        //                         childList.forEach((child: DetectorMetaData) => {
        //                             this.insertInDetectorArray({ name: child.name, id: child.id, score: result.score });
        //                         });
        //                     }
        //                     else {
        //                         this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
        //                     }
        //                 }
        //             });
        //             this.startDetectorRendering(detectorList);
        //             console.log("search result", searchResults, this.detectors);
        //         }
        //     },
        //         (err) => {
        //             this.showPreLoader = false;
        //             this.showPreLoadingError = true;
        //         });
        // }
        // else {
        //     this._activatedRoute.paramMap.subscribe(params => {
        //         this.analysisId = this.analysisId == undefined ? params.get('analysisId') : this.analysisId;
        //         this.detectorId = params.get(this.detectorParmName) === null ? "" : params.get(this.detectorParmName);
        //         this.resetGlobals();
        //         // this.populateSupportTopicDocument();
        //         console.log("before check, successfulviewmodels", this.successfulViewModels);
        //         if (this.analysisId === "searchResultsAnalysis") {
        //             console.log("Here get analysis Id in searchResultsAnalysis", this.analysisId);
        //             this._activatedRoute.queryParamMap.subscribe(qParams => {
        //                 console.log("Here get analysis Id in searchResultsAnalysis trigger search", this.analysisId);
        //                 this.resetGlobals();
        //                 // this.isSearchAnalysisView = true;
        //                 //  this.isSearchAnalysisView = this.searchMode === SearchAnalysisMode.Genie ? false : true;
        //                 this.searchTerm = qParams.get('searchTerm') === null ? this.searchTerm : qParams.get('searchTerm');
        //                 // this is a workaround to get genie on home page work
        //                 //   this.supportDocumentRendered = true;
        //                 if (this.searchMode !== SearchAnalysisMode.Genie && !this.supportDocumentRendered) {
        //                     this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
        //                         if (res && res.json() && res.json().length > 0) {
        //                             var htmlContent = res.json()[0]["htmlContent"];
        //                             // Custom javascript code to remove top header from support document html string
        //                             var tmp = document.createElement("DIV");
        //                             tmp.innerHTML = htmlContent;
        //                             var h2s = tmp.getElementsByTagName("h2");
        //                             if (h2s && h2s.length > 0) {
        //                                 h2s[0].remove();
        //                             }

        //                             // Set the innter html for support document display
        //                             this.supportDocumentContent = tmp.innerHTML;
        //                             this.supportDocumentRendered = true;
        //                         }
        //                     });
        //                 }
        //                 this.showAppInsightsSection = false;
        //                 if (this.searchTerm && this.searchTerm.length > 1) {
        //                     this.searchId = uuid();
        //                     console.log("1. starting search task");
        //                     let searchTask = this._diagnosticService.getDetectorsSearch(this.searchTerm).pipe(map((res) => res), catchError(e => of([])));
        //                     let detectorsTask = this._diagnosticService.getDetectors().pipe(map((res) => res), catchError(e => of([])));
        //                     console.log("search task and detectors task", searchTask, detectorsTask);
        //                     this.showPreLoader = true;
        //                     observableForkJoin([searchTask, detectorsTask]).subscribe(results => {
        //                         this.showPreLoader = false;
        //                         this.showPreLoadingError = false;
        //                         var searchResults: DetectorMetaData[] = results[0];
        //                         this.logEvent(TelemetryEventNames.SearchQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(searchResults.map((det: DetectorMetaData) => new Object({ id: det.id, score: det.score }))), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        //                         var detectorList = results[1];
        //                         console.log("search result and detectors result", searchResults, detectorList);
        //                         if (detectorList) {
        //                             searchResults.forEach(result => {
        //                                 console.log("score:", result.score);
        //                                 if (result.type === DetectorType.Detector) {
        //                                     this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
        //                                 }
        //                                 else if (result.type === DetectorType.Analysis) {
        //                                     var childList = this.getChildrenOfAnalysis(result.id, detectorList);
        //                                     if (childList && childList.length > 0) {
        //                                         childList.forEach((child: DetectorMetaData) => {
        //                                             this.insertInDetectorArray({ name: child.name, id: child.id, score: result.score });
        //                                         });
        //                                     }
        //                                     else {
        //                                         this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
        //                                     }
        //                                 }
        //                             });
        //                             this.startDetectorRendering(detectorList);
        //                             console.log("search result", searchResults, this.detectors);
        //                         }
        //                     },
        //                         (err) => {
        //                             this.showPreLoader = false;
        //                             this.showPreLoadingError = true;
        //                         });
        //                 }
        //             });
        //         }
        //         else {
        //             console.log("Here get analysis Id", this.analysisId);
        //             // Add application insights analysis data
        //             this._diagnosticService.getDetector(this.analysisId, this._detectorControl.startTimeString, this._detectorControl.endTimeString)
        //                 .subscribe((response: DetectorResponse) => {
        //                     this.getApplicationInsightsData(response);
        //                 });

        //             this._diagnosticService.getDetectors().subscribe(detectorList => {
        //                 if (detectorList) {

        //                     if (this.detectorId !== "") {
        //                         let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
        //                         this.detectorName = currentDetector.name;
        //                         return;
        //                     } else {
        //                         this.detectorEventProperties = {
        //                             'StartTime': String(this._detectorControl.startTime),
        //                             'EndTime': String(this._detectorControl.endTime),
        //                             'DetectorId': this.analysisId,
        //                             'ParentDetectorId': "",
        //                             'Url': window.location.href
        //                         };
        //                     }

        //                     detectorList.forEach(element => {

        //                         if (element.analysisTypes != null && element.analysisTypes.length > 0) {
        //                             element.analysisTypes.forEach(analysis => {
        //                                 if (analysis === this.analysisId) {
        //                                     this.detectors.push({ name: element.name, id: element.id });
        //                                     this.loadingMessages.push("Checking " + element.name);
        //                                 }
        //                             });
        //                         }
        //                     });

        //                     this.startDetectorRendering(detectorList);
        //                 }
        //             });
        //         }
        //     });
        // }

    }

    // startDetectorRendering(detectorList) {
    //     this.issueDetectedViewModels = [];
    //     const requests: Observable<any>[] = [];

    //     this.detectorMetaData = detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
    //     console.log("detector meta data", this.detectorMetaData, this.detectors);
    //     this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector));
    //     if (this.detectorViewModels.length > 0) {
    //         this.loadingChildDetectors = true;
    //         this.startLoadingMessage();
    //     }
    //     this.detectorViewModels.forEach((metaData, index) => {
    //      //   console.log("detectorViewModels", this.detectorViewModels, metaData, index);
    //         requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
    //             map((response: DetectorResponse) => {
    //                 this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);

    //                 if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
    //                     if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
    //                         let insight = this.getDetectorInsight(this.detectorViewModels[index]);
    //                         let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };
    //                         this.issueDetectedViewModels.push(issueDetectedViewModel);
    //                         this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => n1.model.status - n2.model.status);
    //                     } else {
    //                         let insight = this.getDetectorInsight(this.detectorViewModels[index]);
    //                         let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };
    //                         // if (!this.successfulViewModels.find((viewM) => { viewM.insightTitle === successViewModel.insightTitle })) {
    //                         //     console.log("successfulviewmodels push", this.successfulViewModels, successViewModel);
    //                         //     this.successfulViewModels.push(successViewModel);
    //                         // }
    //                         this.successfulViewModels.push(successViewModel);
    //                     }
    //                 }

    //                 return {
    //                     'ChildDetectorName': this.detectorViewModels[index].title,
    //                     'ChildDetectorId': this.detectorViewModels[index].metadata.id,
    //                     'ChildDetectorStatus': this.detectorViewModels[index].status,
    //                     'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
    //                 };
    //             })
    //             , catchError(err => {
    //                 this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
    //                 return of({});
    //             })
    //         ));
    //     });

    //     // Log all the children detectors
    //     observableForkJoin(requests).subscribe(childDetectorData => {
    //         setTimeout(() => {
    //             let dataOutput = {};
    //             dataOutput["status"] = true;
    //             dataOutput["data"] = {
    //                 'detectors': this.detectors,
    //                 'successfulViewModels': this.successfulViewModels,
    //                 'issueDetectedViewModels': this.issueDetectedViewModels
    //             };

    //             console.log("emitting data 1", dataOutput);
    //             this.onComplete.emit(dataOutput);
    //         }, 10);

    //         this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
    //         this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
    //     });

    //     if (requests.length === 0) {
    //         let dataOutput = {};
    //         dataOutput["status"] = true;
    //         dataOutput["data"] = {
    //             'detectors': []
    //         };

    //         console.log("emitting data 2", dataOutput);
    //         this.onComplete.emit(dataOutput);
    //     }
    // }

    getChildrenOfAnalysis(analysisId, detectorList) {
        return detectorList.filter(element => (element.analysisTypes != null && element.analysisTypes.length > 0 && element.analysisTypes.findIndex(x => x == analysisId) >= 0)).map(element => { return { name: element.name, id: element.id }; });
    }

    insertInDetectorArray(detectorItem) {
        if (this.detectors.findIndex(x => x.id === detectorItem.id) < 0 && detectorItem.score >= this.targetedScore) {
            this.detectors.push(detectorItem);
        }
    }
    getPendingDetectorCount(): number {
        let pendingCount = 0;
       // console.log("detectorviewmodels", this.detectorViewModels);
        this.detectorViewModels.forEach((metaData, index) => {
            if (this.detectorViewModels[index].loadingStatus == LoadingStatus.Loading) {
                ++pendingCount;
            }
        });

        return pendingCount;
    }

    resetGlobals() {
        this.detectors = [];
        this.detectorViewModels = [];
        this.issueDetectedViewModels = [];
        this.loadingChildDetectors = false;
        this.allSolutions = [];
        this.loadingMessages = [];
        this.successfulViewModels = [];

    }

    getDetectorInsight(viewModel: any): any {
        let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(viewModel.response);
        let insight: any;
        if (allInsights.length > 0) {

            let description = null;
            if (allInsights[0].hasData()) {
                description = allInsights[0].data["Description"];
            }
            insight = { title: allInsights[0].title, description: description };

            // now populate solutions for all the insights
            allInsights.forEach(i => {
                if (i.solutions != null) {
                    i.solutions.forEach(s => {
                        if (this.allSolutions.findIndex(x => x.Name === s.Name) === -1) {
                            this.allSolutions.push(s);
                        }
                    });
                }
            });
        }

        return insight;
    }

    ngOnChanges() {
    }

    private updateDetectorViewModelSuccess(viewModel: any, res: DetectorResponse) {
        const status = res.status.statusId;

        viewModel.loadingStatus = LoadingStatus.Success,
            viewModel.status = status;
        viewModel.statusColor = StatusStyles.getColorByStatus(status),
            viewModel.statusIcon = StatusStyles.getIconByStatus(status),
            viewModel.response = res;
        return viewModel;
    }

    private getDetectorViewModel(detector: DetectorMetaData) {
        return {
            title: detector.name,
            metadata: detector,
            loadingStatus: LoadingStatus.Loading,
            status: null,
            statusColor: null,
            statusIcon: null,
            expanded: false,
            response: null,
            request: this._diagnosticService.getDetector(detector.id, this._detectorControl.startTimeString, this._detectorControl.endTimeString)
        };
    }

    public selectDetector(viewModel: any) {
        // if (viewModel != null && viewModel.model.metadata.id) {
        //     let detectorId = viewModel.model.metadata.id;
        //     console.log("viewmodel", viewModel);
        //     console.log("viewmodel", viewModel.model.metadata.category);
        //     //  let categoryName = encodeURIComponent(viewModel.model.metadata.category);
        //     let categoryName = "";

        //     if (viewModel.model.metadata.category) {
        //         categoryName = viewModel.model.metadata.category.replace(/\s/g, '');
        //     }
        //     else {
        //         categoryName = this._router.url.split('/')[11];
        //         console.log("uncatgorized category name", categoryName);
        //     }

        //     console.log("after encode", categoryName);
        //     if (detectorId !== "") {

        //         const clickDetectorEventProperties = {
        //             'ChildDetectorName': viewModel.model.title,
        //             'ChildDetectorId': viewModel.model.metadata.id,
        //             'IsExpanded': true,
        //             'Status': viewModel.model.status
        //         };

        //         // Log children detectors click
        //         this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);

        //         if (this.analysisId === "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length > 0) {
        //             this.logEvent(TelemetryEventNames.SearchResultClicked, { searchId: this.searchId, detectorId: detectorId, rank: 0, title: clickDetectorEventProperties.ChildDetectorName, status: clickDetectorEventProperties.Status, ts: Math.floor((new Date()).getTime() / 1000).toString() });
        //             console.log("detectorlist current router", this._router.url, this.resourceId);

        //             let dest1 = `resource${this.resourceId}/categories/${categoryName}/detectors/${detectorId}`;
        //             //     let dest = `../../categories/ConfigurationAndManagement/detectors/${detectorId}`;
        //             //let dest = `../../categories/${categoryName}/detectors/${detectorId}`;
        //             console.log("navigate to", dest1);

        //             // This router is different for genie and case submission flow
        //             //  this._router.navigate([`../analysis/${this.analysisId}/search/detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm } });
        //             // ConfigurationAndManagement
        //             //navigate to ../../categories/ConfigurationandManagement/detectors/swap
        //             this._globals.openGeniePanel = false;
        //             console.log("close panel and openGeniePanel", this._globals);
        //             //this._router.navigateByUrl(`${dest1}`).then(()=>{ console.log("navigated");});
        //             this._router.navigate([dest1]);
        //             //  this.customRedirectTo(dest1);

        //             //    this._router.navigate([`${dest}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm } });
        //             //   this.navigateTo([`../detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm } });
        //             //  this._activatedRoute.
        //             //  this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/analysis`);
        //         }
        //         else {
        //             this._router.navigate([`../../analysis/${this.analysisId}/detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true });
        //         }
        //     }
        // }
    }

    customRedirectTo(uri: string) {
        this._router.navigateByUrl(uri).then(() => {
            console.log("navigated in customRedirect");
            // this._router.navigate([uri]);
            //  this._router.
        }
        );
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };
        var pathSegments = path.split('/');
        let segments: string[] = [path];
        this._router.navigate(segments, navigationExtras);
        console.log("this._route", this._router);
        console.log("activatedRoute", this._activatedRoute);
    }

    startLoadingMessage(): void {
        let self = this;
        this.loadingMessageIndex = 0;
        this.showLoadingMessage = true;

        setTimeout(() => {
            self.showLoadingMessage = false;
        }, 3000)
        this.loadingMessageTimer = setInterval(() => {
            self.loadingMessageIndex++;
            self.showLoadingMessage = true;

            if (self.loadingMessageIndex === self.loadingMessages.length - 1) {
                clearInterval(this.loadingMessageTimer);
                return;
            }

            setTimeout(() => {
                self.showLoadingMessage = false;
            }, 3000)
        }, 4000);
    }
}

