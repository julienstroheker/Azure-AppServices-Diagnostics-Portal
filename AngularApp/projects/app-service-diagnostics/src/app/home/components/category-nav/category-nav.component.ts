import { Component, OnInit, Injector, Pipe, PipeTransform } from '@angular/core';
import { MessageProcessor } from '../../../supportbot/message-processor.service';
import { ActivatedRoute, Router, NavigationExtras, NavigationEnd, Scroll } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { INavProps, INavLink, INav, autobind, INavStyles } from 'office-ui-fabric-react';
import { GenericApiService } from '../../../shared/services/generic-api.service';
import { CategoriesService } from '../../../shared/services/categories.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Tile } from '../../../shared/components/tile-list/tile-list.component';
import { Feature } from '../../../shared-v2/models/features';
import { AuthService } from '../../../startup/services/auth.service';
import { DiagnosticService, DetectorMetaData, DetectorType, DetectorResponse } from 'diagnostic-data';
import { filter } from 'rxjs/operators';
import { CollapsibleMenuItem, CollapsibleMenuItemComponent } from '../collapsible-menu-item/collapsible-menu-item.component';
import { DetectorCategorizationService } from '../../../shared/services/detector-categorized.service';
import { SiteFeatureService } from '../../../resources/web-sites/services/site-feature.service';
import { SiteFilteredItem } from '../../../resources/web-sites/models/site-filter';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../../shared/models/portal';
import { OperatingSystem, HostingEnvironmentKind } from '../../../shared/models/site';
import { Sku } from '../../../shared/models/server-farm';
import { icons } from '../../../fabric-ui/icons-constants';
// import { SiteFilteredItem } from '../models/site-filter';
// import { WebSitesService } from '../services/web-sites.service';

@Component({
    selector: 'category-nav',
    templateUrl: './category-nav.component.html',
    styleUrls: ['./category-nav.component.scss']
})
export class CategoryNavComponent implements OnInit {
    imageRootPath = '../../../../assets/img/detectors';
    toolCategories: SiteFilteredItem<any>[] = [];
    toolCategoriesFilteredByStack: SiteFilteredItem<any>[] = [];
    currentRoutePath: string[];
    allProblemCategories: Category[] = [];
    features: Feature[];
    tiles: Tile[];

    startingKey: string;

    category: Category;
    categoryName: string;
    resourceId = "";
    baseUrl = "";
    selectedId = "";
    groups: any;
    isDiagnosticTools: boolean = false;
    categoryId: string = "";

    initialSelectedKey: INavProps["initialSelectedKey"] = "overview";
    selectedKey: INavProps["initialSelectedKey"];

    styles: any;
    collapsible: any = false;
    hasUncategorizedDetectors: boolean = false;

    isSelected(detectorId: string) {
        let routerUrl = this._route.url.toLocaleLowerCase();
        return routerUrl.includes(`detectors/${detectorId}`) || routerUrl.includes(`analysis/${detectorId}`);
    }

    tempCategoriesArray: any[] = [];
    tempToolsArray: any[] = [];
    tempArray = [];
    transform(siteFilteredItems: SiteFilteredItem<any>[]): any[] {
        this.tempArray = [];
        return siteFilteredItems
            .filter(item =>
                (item.appType & this._webSiteService.appType) > 0 &&
                (item.platform & this._webSiteService.platform) > 0 &&
                (item.sku & this._webSiteService.sku) > 0 &&
                (item.hostingEnvironmentKind & this._webSiteService.hostingEnvironmentKind) > 0 &&
                (item.stack === ''
                    // || (overrideStack && (overrideStack === '' || overrideStack.toLowerCase() === 'all'))
                    || item.stack.toLowerCase().indexOf('all') >= 0) &&
                (!this.alreadyAdded(item.item)))
            .map(item => item);
    }

    stackMatchedForTools(item: SiteFilteredItem<any>): boolean {
        return (item.appType & this._webSiteService.appType) > 0 &&
            (item.platform & this._webSiteService.platform) > 0 &&
            (item.sku & this._webSiteService.sku) > 0 &&
            (item.hostingEnvironmentKind & this._webSiteService.hostingEnvironmentKind) > 0 &&
            // (item.stack === ''
            // || (overrideStack && (overrideStack === '' || overrideStack.toLowerCase() === 'all'))
            // || item.stack.toLowerCase().indexOf('all') >= 0) &&
            (!this.toolsAlreadyAdded(item.item));
    }

    alreadyAdded(item: any): boolean {
        if (item.title && this.tempArray.indexOf(item.title) > -1) {
            return true;
        }
        this.tempArray.push(item.title);
        return false;
    }

    toolsAlreadyAdded(item: any): boolean {
        console.log("checking tools name:", item.name);
        if (item.name && this.tempToolsArray.indexOf(item.name) > -1) {
            return true;
        }
        this.tempToolsArray.push(item.name);
        return false;
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };
        var pathSegments = path.split('/');
        let segments: string[] = [path];
        this._route.navigate(segments, navigationExtras).then(() => {
            console.log("navigated", segments, navigationExtras);
        });
        console.log("this._route", this._route.url);
        console.log("activatedRoute", this._activatedRoute);
    }


    constructor(public siteFeatureService: SiteFeatureService, protected _diagnosticApiService: DiagnosticService, private _route: Router, private _injector: Injector, private _activatedRoute: ActivatedRoute, private categoryService: CategoryService,
        private _chatState: CategoryChatStateService, private _genericApiService: GenericApiService
        , private _featureService: FeatureService, protected _authService: AuthService, public _detectorCategorization: DetectorCategorizationService, private _webSiteService: WebSitesService) { }

    detectorDataLocalCopy: DetectorMetaData[] = [];
    detectorList: CollapsibleMenuItem[] = [];
    orphanDetectorList: CollapsibleMenuItem[] = [];
    orphanDetectorList1: CollapsibleMenuItem[] = [];
    currentDetectorId: string = null;
    private getCurrentRoutePath() {
        this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
    }
    ngOnInit() {
        if (!this._activatedRoute.firstChild.snapshot.params['analysisId'])
        {
            if (this._activatedRoute.firstChild.snapshot.params['detectorName']) {
                this.currentDetectorId = this._activatedRoute.firstChild.snapshot.params['detectorName'];
            } else if (this._activatedRoute.firstChild.snapshot.params['analysisId']) {
                this.currentDetectorId = this._activatedRoute.firstChild.snapshot.params['analysisId'];
            } else {
                this.currentDetectorId = null;
            }
        }
        else
        {
            this.currentDetectorId = this._activatedRoute.firstChild.snapshot.params['analysisId'];
        }


        this.hasUncategorizedDetectors = false;
        console.log("init category-nav");
        this._route.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
            this.getCurrentRoutePath();
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp | AppType.FunctionApp,
            platform: OperatingSystem.windows,
            sku: Sku.NotDynamic,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Proactive Tools',
                tools: this.siteFeatureService.proactiveTools.map(tool => {
                    let isSelected = () => {
                        return this._route.url.includes("/" + tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
                })
            }
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp | AppType.FunctionApp,
            platform: OperatingSystem.windows,
            sku: Sku.NotDynamic,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Diagnostic Tools',
                tools: this.siteFeatureService.diagnosticTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
                    let isSelected = () => {
                        return this._route.url.includes("/" + tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
                })
            }
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp,
            platform: OperatingSystem.windows,
            sku: Sku.NotDynamic,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Support Tools',
                tools: this.siteFeatureService.supportTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
                    let isSelected = () => {
                        return this._route.url.includes("/" + tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
                })
            }
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp,
            platform: OperatingSystem.windows,
            sku: Sku.NotDynamic,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Premium Tools',
                tools: this.siteFeatureService.premiumTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
                    let isSelected = () => {
                        return this._route.url.includes("/" + tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
                })
            }
        });

        this.toolCategoriesFilteredByStack = this.transform(this.toolCategories);

        this.categoryService.categories.subscribe(categories => {
            //  let decodedCategoryName = decodeURIComponent(this._activatedRoute.snapshot.params.category);
            let decodedCategoryName = this._activatedRoute.snapshot.params.category.toLowerCase();
            this.category = categories.find(category => category.id.toLowerCase() === this._activatedRoute.snapshot.params.category.toLowerCase() || category.name.replace(/\s/g, '').toLowerCase() == decodedCategoryName);
            this._chatState.category = this.category;
            this.categoryName = this.category.name;
            this.categoryId = this.category.id;
            this.isDiagnosticTools = this.category.id === "DiagnosticTools";

            this.orphanDetectorList = this._detectorCategorization.detectorlistCategories[this.category.id];

            this._authService.getStartupInfo().subscribe(startupInfo => {
                this.resourceId = startupInfo.resourceId;
                this.baseUrl = `resource${this.resourceId}/categories/${this.category.id}/`;
            });

            // Get all the detector list under this category
            this._diagnosticApiService.getDetectors().subscribe(detectors => {
                this.detectorDataLocalCopy = detectors;
                detectors.forEach((detector, index) => {
                    if (detector.category === this.category.name) {
                        if ((detector.category && detector.category.length > 0) ||
                            (detector.description && detector.description.length > 0)) {
                            let routePath: any = "detectors";
                            if (detector.type === DetectorType.Analysis) {
                                routePath = "analysis";
                            }
                            let onClick = () => {
                                this.navigateTo(`${routePath}/${detector.id}`);
                            };

                            let isSelected = () => {
                                return this.currentDetectorId === detector.id;
                            };

                            let icon = this.getIconImagePath(detector.id);
                            let menuItem = new CollapsibleMenuItem(detector.name, onClick, isSelected, icon);

                            this.detectorList.push(menuItem);
                        }
                    }
                });
            });

            this._route.events.subscribe((evt) => {
                if (evt instanceof NavigationEnd) {
                    let itemId = "";
                    let routePath: any = "detectors";
                    if (!(evt.url.split("/").length > 14 && evt.url.split("/")[12].toLowerCase() === "analysis" && (evt.url.split("/")[14].toLowerCase() === "detectors" || evt.url.split("/")[14].toLowerCase() === "analysis"))) {
                        if (evt.url.split("/")[12].toLowerCase() === "detectors")
                        {
                            itemId = evt.url.split("detectors/")[1].split("?")[0];
                        }
                        else if (evt.url.split("/")[12].toLowerCase() === "analysis")
                        {
                            itemId = evt.url.split("analysis/")[1].split("?")[0];
                            routePath = "analysis";
                        }

                        // itemId = evt.url.split("/")[1];
                        // if (evt.url.split("/")[14].toLowerCase() === "analysis") {
                        //     routePath = "analysis";
                        // }
                        // else if (evt.url.includes("analysis/")) {
                        //     itemId = evt.url.split("analysis/")[1].split("?")[0];
                        //     routePath = "analysis";
                        // }

                        let item = this.detectorDataLocalCopy.find(metadata => metadata.id.toLowerCase() === itemId.toLowerCase());

                        if (item && (item.category == undefined || item.category == "") && !this.detectorList.find((detector) => detector.label === item.id)) {
                            if (!this.orphanDetectorList.find((orphan) => (orphan.label) === item.name)) {
                                let isSelected = () => {
                                    return this._route.url.includes(`detectors/${item.id}`) || this._route.url.includes(`analysis/${item.id}`);
                                };
                                let icon = this.getIconImagePath(item.id);
                                let onClick = () => {
                                    let dest1 = `resource${this.resourceId}/categories/${this.categoryId}/${routePath}/${item.id}`;
                                    console.log("navigate to", dest1);
                                    this._route.navigate([dest1]);
                                };
                                let orphanMenuItem = new CollapsibleMenuItem(item.name, onClick, isSelected, icon);

                                if (!this.orphanDetectorList.find((item1 => item1.label === orphanMenuItem.label))) {
                                    this._detectorCategorization.detectorlistCategories[this.category.id].push(orphanMenuItem);
                                }
                                console.log("orphanlist", this.orphanDetectorList, this._detectorCategorization.detectorlistCategories);
                                this.orphanDetectorList = this._detectorCategorization.detectorlistCategories[this.category.id];
                                console.log("orphanlist", this._detectorCategorization.detectorlistCategories);
                                // this._detectorCategorization.pushDetectorToCategory(orphanMenuItem, this.category.id);
                            }
                        }

                        console.log("evt and list", evt, itemId, this.orphanDetectorList);
                    }
                }
            }
            );
        });
    }

    private getIconImagePath(name: string) {
        const fileName = icons.has(name) ? name : 'default';
        return `${this.imageRootPath}/${fileName}.svg`;
    }
}
