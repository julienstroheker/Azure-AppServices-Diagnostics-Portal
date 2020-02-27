import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { GenericSupportTopicService } from 'diagnostic-data';
import { HomeComponent } from './components/home/home.component';
import { CategoryChatComponent } from './components/category-chat/category-chat.component';
import { CategoryTileComponent } from './components/category-tile/category-tile.component';
import { CategoryTabResolver, CategoryChatResolver } from './resolvers/category-tab.resolver';
import { SupportBotModule } from '../supportbot/supportbot.module';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { FormsModule } from '@angular/forms';
import { GenericDetectorComponent } from '../shared/components/generic-detector/generic-detector.component';
import { TabTitleResolver } from '../shared/resolvers/tab-name.resolver';
import { SupportTopicRedirectComponent } from './components/support-topic-redirect/support-topic-redirect.component';
import { TimeControlResolver } from './resolvers/time-control.resolver';
import { ContentService } from '../shared-v2/services/content.service';
import { DiagnosticDataModule } from 'diagnostic-data';
import { GenericAnalysisComponent } from '../shared/components/generic-analysis/generic-analysis.component';
import { CategorySummaryComponent } from '../fabric-ui/components/category-summary/category-summary.component';
import { CategoryOverviewComponent } from '../fabric-ui/components/category-overview/category-overview.component';
//import { GeniePanelComponent } from '../fabric-ui/components/genie-panel/genie-panel.component';
import { DiagnosticsSettingsComponent } from './components/diagnostics-settings/diagnostics-settings.component';
import { SupportTopicService } from '../shared-v2/services/support-topic.service';
import { MarkdownModule } from 'ngx-markdown';
import { PortalReferrerResolverComponent } from '../shared/components/portal-referrer-resolver/portal-referrer-resolver.component';
import { SearchPipe, SearchMatchPipe } from './components/pipes/search.pipe';

import { CategoryNavComponent } from './components/category-nav/category-nav.component';
import { CollapsibleMenuItemComponent } from './components/collapsible-menu-item/collapsible-menu-item.component';
import { SectionDividerComponent } from './components/section-divider/section-divider.component';
import { FabricSearchResultsComponent } from '../fabric-ui/components/fabric-search-results/fabric-search-results.component';
import { FabricFeedbackComponent } from '../fabric-ui/components/fabric-feedback/fabric-feedback.component';
import { FabricFeedbackContainerComponent } from '../fabric-ui/components/fabric-feedback-container/fabric-feedback-container.component';
import {
    FabSearchBoxModule,
    // FabShimmerModule,
    // FabSliderModule,
    // FabSpinnerModule,
    // FabToggleModule,
    // FabTooltipModule,
    // FabSpinButtonModule,
    // FabTextFieldModule,
    // FabPeoplePickerModule,
    // FabTagPickerModule,
    // FabProgressIndicatorModule,
    // FabContextualMenuModule
} from '@angular-react/fabric';
import { UncategorizedDetectorsResolver } from './resolvers/uncategorized-detectors.resolver';
import { DetectorCategorizationService } from '../shared/services/detector-categorized.service';
import { ToolNames } from '../shared/models/tools-constants';
import { ProfilerToolComponent } from '../shared/components/tools/profiler-tool/profiler-tool.component';
import { MemoryDumpToolComponent } from '../shared/components/tools/memorydump-tool/memorydump-tool.component';
import { JavaThreadDumpToolComponent } from '../shared/components/tools/java-threaddump-tool/java-threaddump-tool.component';
import { JavaMemoryDumpToolComponent } from '../shared/components/tools/java-memorydump-tool/java-memorydump-tool.component';
import { HttpLogAnalysisToolComponent } from '../shared/components/tools/http-loganalysis-tool/http-loganalysis-tool.component';
import { PhpLogsAnalyzerToolComponent } from '../shared/components/tools/php-logsanalyzer-tool/php-logsanalyzer-tool.component';
import { PhpProcessAnalyzerToolComponent } from '../shared/components/tools/php-processanalyzer-tool/php-processanalyzer-tool.component';
import { ConnectionDiagnoserToolComponent } from '../shared/components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { AutohealingComponent } from '../auto-healing/autohealing.component';
import { NetworkTraceToolComponent } from '../shared/components/tools/network-trace-tool/network-trace-tool.component';
import { DaasMainComponent } from '../shared/components/daas-main/daas-main.component';
import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute } from '@angular/router';
import { AutohealingDetectorComponent } from '../availability/detector-view/detectors/autohealing-detector/autohealing-detector.component';
import { CpuMonitoringToolComponent } from '../shared/components/tools/cpu-monitoring-tool/cpu-monitoring-tool.component';
import { EventViewerComponent } from '../shared/components/daas/event-viewer/event-viewer.component';
import { FrebViewerComponent } from '../shared/components/daas/freb-viewer/freb-viewer.component';
import { Injectable, Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PortalActionService } from '../shared/services/portal-action.service';
import { DiagnosticToolsRoutes, MetricsPerInstanceAppServicePlanResolver, AdvanceApplicationRestartResolver, SecurityScanningResolver, MetricsPerInstanceAppsResolver } from '../diagnostic-tools/diagnostic-tools.routeconfig';
import { CategoryTileV4Component } from '../fabric-ui/components/category-tile-v4/category-tile-v4.component';
import { CategoryChatV4Component } from '../fabric-ui/components/category-chat-v4/category-chat-v4.component';
import { VersionTestService } from '../fabric-ui/version-test.service';
export const HomeRoutes = RouterModule.forChild([
    {
        path: '',
        component: HomeComponent,
        data: {
            navigationTitle: 'Home',
            cacheComponent: true
        },
        pathMatch: 'full',
    },
    {
        path: 'categoriesv3/:category',
        component: CategoryChatComponent,
        data: {
          cacheComponent: true
        },
        resolve: {
          navigationTitle: CategoryTabResolver,
          messageList: CategoryChatResolver
        }
    },
    {
        path: 'categories/:category',
        component: CategorySummaryComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: 'overview',
                component: CategoryOverviewComponent,
                data: {
                    cacheComponent: true,
                    navigationTitle: CategoryTabResolver,
                },
            },
            {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full',
                data: {
                    cacheComponent: true
                },
            },
            {
                path: 'analysis/:analysisId',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'analysis/:analysisId/search',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'detectors/:detectorName',
                component: GenericDetectorComponent,
                data: {
                    cacheComponent: true
                },
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                    uncategorizedDetector: UncategorizedDetectorsResolver,
                }
            },
            {
                path: 'analysis/:analysisId/search/detectors/:detectorName',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'analysis/:analysisId/detectors/:detectorName',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'tools/profiler',
                component: ProfilerToolComponent,
                data: {
                    navigationTitle: ToolNames.Profiler,
                    cacheComponent: true
                }
            },
            // Memory Dump
            {
                path: 'tools/memorydump',
                component: MemoryDumpToolComponent,
                data: {
                    navigationTitle: ToolNames.MemoryDump,
                    cacheComponent: true
                }
            },
            // Java Thread Dump
            {
                path: 'tools/javathreaddump',
                component: JavaThreadDumpToolComponent,
                data: {
                    navigationTitle: ToolNames.JavaThreadDump,
                    cacheComponent: true
                }
            },
            // Java Memory Dump
            {
                path: 'tools/javamemorydump',
                component: JavaMemoryDumpToolComponent,
                data: {
                    navigationTitle: ToolNames.JavaMemoryDump,
                    cacheComponent: true
                }
            },
            // HTTP Log Analyzer
            {
                path: 'tools/httploganalyzer',
                component: HttpLogAnalysisToolComponent,
                data: {
                    navigationTitle: ToolNames.HttpLogAnalyzer,
                    cacheComponent: true
                }
            },
            // PHP Log Analyzer
            {
                path: 'tools/phploganalyzer',
                component: PhpLogsAnalyzerToolComponent,
                data: {
                    navigationTitle: ToolNames.PHPLogAnalyzer,
                    cacheComponent: true
                }
            },
            // PHP Process Analyzer
            {
                path: 'tools/phpprocessanalyzer',
                component: PhpProcessAnalyzerToolComponent,
                data: {
                    navigationTitle: ToolNames.PHPProcessAnalyzer,
                    cacheComponent: true
                }
            },
            // Database Test Tool(connection string)
            {
                path: 'tools/databasetester',
                component: ConnectionDiagnoserToolComponent,
                data: {
                    navigationTitle: ToolNames.DatabaseTester,
                    cacheComponent: true
                }
            },
            // CPU Monitoring tool
            {
                path: 'tools/cpumonitoring',
                component: CpuMonitoringToolComponent,
                data: {
                    navigationTitle: ToolNames.CpuMonitoring,
                    cacheComponent: true
                }
            },
            // Autohealing
            {
                path: 'tools/mitigate',
                component: AutohealingComponent,
                data: {
                    navigationTitle: ToolNames.AutoHealing,
                    detectorComponent: AutohealingDetectorComponent
                }
            },
            // Network Trace
            {
                path: 'tools/networktrace',
                component: NetworkTraceToolComponent,
                data: {
                    navigationTitle: ToolNames.NetworkTrace,
                    cacheComponent: true
                }
            },
            // Diagnostics
            {
                path: 'tools/daas',
                component: DaasMainComponent,
                data: {
                    navigationTitle: ToolNames.Diagnostics,
                    cacheComponent: true
                }
            },
            // Event Viewer
            {
                path: 'tools/eventviewer',
                component: EventViewerComponent,
                data: {
                    navigationTitle: ToolNames.EventViewer,
                    cacheComponent: true
                }
            },
            // Freb Viewer
            {
                // path: 'tools/frebviewer',
                path: 'tools/freblogs',
                component: FrebViewerComponent,
                data: {
                    navigationTitle: ToolNames.FrebViewer,
                    cacheComponent: true
                }
            },
            //Metrics per Instance (Apps)
            {
                // path: 'tools/metricsperinstance',
                path: 'tools/sitemetrics',
                resolve: {
                    reroute: MetricsPerInstanceAppsResolver
                },
            },
            //Metrics per Instance (App Service Plan)
            {
                // path: 'tools/metricsperinstanceappserviceplan',
                path: 'tools/appserviceplanmetrics',
                resolve: {
                    reroute: MetricsPerInstanceAppServicePlanResolver
                },
            },
            //Advanced Application Restart
            {
                // path: 'tools/applicationrestart',
                path: 'tools/advancedapprestart',
                resolve: {
                    reroute: AdvanceApplicationRestartResolver
                },
            },
            //Security Scanning
            {
                // path: 'tools/securityscanning',
                path: 'tools/tinfoil',
                resolve: {
                    reroute: SecurityScanningResolver
                },
            }
        ],
        resolve: {
            navigationTitle: CategoryTabResolver,
            // messageList: CategoryChatResolver
        }
    },
    {
        path: 'detectors/:detectorName',
        component: GenericDetectorComponent,
        data: {
            cacheComponent: true
        },
        resolve: {
            time: TimeControlResolver,
            navigationTitle: TabTitleResolver,
        }
    },
    {
        path: 'analysis/:analysisId/detectors/:detectorName',
        component: GenericAnalysisComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: '',
                component: GenericDetectorComponent,
                data: {
                    analysisMode: true,
                    cacheComponent: true
                }
            }
        ],
        resolve: {
            time: TimeControlResolver,
            navigationTitle: TabTitleResolver,
        }
    },
    {
        path: 'analysis/:analysisId',
        component: GenericAnalysisComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: '',
                component: GenericDetectorComponent,
                data: {
                    analysisMode: true,
                    cacheComponent: true
                }
            }
        ],
        resolve: {
            time: TimeControlResolver,
            navigationTitle: TabTitleResolver,
        }
    },
    {
        path: 'analysis/:analysisId/search',
        component: GenericAnalysisComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: '',
                component: GenericDetectorComponent,
                data: {
                    analysisMode: true,
                    cacheComponent: true
                }
            }
        ],
        resolve: {
            time: TimeControlResolver,
            navigationTitle: TabTitleResolver,
        }
    },
    {
        path: 'analysis/:analysisId/search/detectors/:detectorName',
        component: GenericAnalysisComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: '',
                component: GenericDetectorComponent,
                data: {
                    analysisMode: true,
                    cacheComponent: true
                }
            }
        ],
        resolve: {
            time: TimeControlResolver,
            navigationTitle: TabTitleResolver,
        }
    },
    {
        path: 'analysis/:analysisId/detectors',
        component: GenericAnalysisComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: '',
                component: GenericDetectorComponent,
                data: {
                    analysisMode: true,
                    cacheComponent: true
                }
            }
        ],
        resolve: {
            time: TimeControlResolver,
            navigationTitle: TabTitleResolver,
        }
    },
    {
        path: 'supportTopicId',
        component: SupportTopicRedirectComponent
    },
    {
        path: 'settings',
        component: DiagnosticsSettingsComponent,
        data: {
            navigationTitle: 'App Service Diagnostics Settings'
        }
    },
    {
        path: 'portalReferrerResolver',
        component: PortalReferrerResolverComponent,
        data: {
            cacheComponent: true
        },
        resolve: {
            time: TimeControlResolver
        }
    }
]);

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        DiagnosticDataModule,
        HomeRoutes,
        SupportBotModule,
        FormsModule,
        MarkdownModule.forRoot(),
        FabSearchBoxModule
    ],
    declarations: [HomeComponent, CategoryChatComponent, CategoryTileComponent, SearchResultsComponent, SupportTopicRedirectComponent, DiagnosticsSettingsComponent,CategoryTileV4Component,CategoryChatV4Component],
    // ,FabricFeedbackComponent,FabricFeedbackContainerComponent
    providers:
        [
            CategoryTabResolver,
            CategoryChatResolver,
            TimeControlResolver,
            UncategorizedDetectorsResolver,
            DetectorCategorizationService,
            MetricsPerInstanceAppsResolver,
            MetricsPerInstanceAppServicePlanResolver,
            AdvanceApplicationRestartResolver,
            SecurityScanningResolver,
            { provide: GenericSupportTopicService, useExisting: SupportTopicService }
        ],
    // exports: [GeniePanelComponent]
})
export class HomeModule { }
