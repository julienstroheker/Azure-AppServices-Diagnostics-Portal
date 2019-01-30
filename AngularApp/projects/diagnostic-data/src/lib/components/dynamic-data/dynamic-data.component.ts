import { BehaviorSubject } from 'rxjs';
import {
    Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { DiagnosticData, Rendering, RenderingType } from '../../models/detector';
import { CardSelectionComponent } from '../card-selection/card-selection.component';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DataSummaryComponent } from '../data-summary/data-summary.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DetectorListComponent } from '../detector-list/detector-list.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DynamicInsightComponent } from '../dynamic-insight/dynamic-insight.component';
import { EmailComponent } from '../email/email.component';
import { InsightsComponent } from '../insights/insights.component';
import { MarkdownComponent } from '../markdown/markdown.component';
import { TimeSeriesGraphComponent } from '../time-series-graph/time-series-graph.component';
import {
    TimeSeriesInstanceGraphComponent
} from '../time-series-instance-graph/time-series-instance-graph.component';

@Component({
  selector: 'dynamic-data',
  templateUrl: './dynamic-data.component.html',
  styleUrls: ['./dynamic-data.component.scss'],
  entryComponents: [TimeSeriesGraphComponent, DataTableComponent, DataSummaryComponent, EmailComponent,
    InsightsComponent, TimeSeriesInstanceGraphComponent, DynamicInsightComponent, MarkdownComponent,
    DetectorListComponent, DropdownComponent, CardSelectionComponent]
})
export class DynamicDataComponent implements OnInit {

  private dataBehaviorSubject: BehaviorSubject<DiagnosticData> = new BehaviorSubject<DiagnosticData>(null);

  @Input() set diagnosticData(data: DiagnosticData) {
    this.dataBehaviorSubject.next(data);
  }

  @Input() startTime: Moment;
  @Input() endTime: Moment;
  @Input() detectorEventProperties: any;

  @ViewChild('dynamicDataContainer', { read: ViewContainerRef }) dynamicDataContainer: ViewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit(): void {
    this.dataBehaviorSubject.subscribe((diagnosticData: DiagnosticData) => {
      const component = this._findInputComponent((<Rendering>diagnosticData.renderingProperties).type);
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);

      const viewContainerRef = this.dynamicDataContainer;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent(componentFactory);
      const instance = <DataRenderBaseComponent>(componentRef.instance);
      instance.diagnosticDataInput = diagnosticData;
      instance.startTime = this.startTime;
      instance.endTime = this.endTime;
      instance.detectorEventProperties = this.detectorEventProperties;
    });
  }

  private _findInputComponent(type: RenderingType): any {
    switch (type) {
      case RenderingType.TimeSeries:
        return TimeSeriesGraphComponent;
      case RenderingType.Table:
        return DataTableComponent;
      case RenderingType.DataSummary:
        return DataSummaryComponent;
      case RenderingType.Email:
        return EmailComponent;
      case RenderingType.Insights:
        return InsightsComponent;
      case RenderingType.TimeSeriesPerInstance:
        return TimeSeriesInstanceGraphComponent;
      case RenderingType.DynamicInsight:
        return DynamicInsightComponent;
      case RenderingType.Markdown:
        return MarkdownComponent;
      case RenderingType.DetectorList:
        return DetectorListComponent;
      case RenderingType.DropDown:
        return DropdownComponent;
      case RenderingType.Cards:
        return CardSelectionComponent;
      default:
        return null;
    }
  }

}
