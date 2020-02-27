import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import {
    PanelType,
    IPanelStyles,
    ICalendarStrings,
    IContextualMenuProps,
    ISelection,
    Selection,
    DropdownMenuItemType,
    IDropdownOption,
    ICheckboxProps,
    IPersonaProps,
    IPeoplePickerProps
} from 'office-ui-fabric-react';


@Component({
    selector: 'genie-panel',
    templateUrl: './genie-panel.component.html',
    styleUrls: ['./genie-panel.component.scss']
})
export class GeniePanelComponent implements OnInit, OnDestroy {
    @ViewChild('scrollMe', { static: true }) myScrollContainer: any;
    @Input() resourceId: string = "";

    // Genie panel
    searchValue: string="";
    type: PanelType = PanelType.custom;
    showTypingMessage: boolean;
    chatContainerHeight: number;
    loading: boolean = true;
    navigationContent: (() => HTMLElement);
    renderFooter: (() => HTMLElement);
    isLightDismiss: boolean = true;
    welcomeMessage: string = "Welcome to App Service Diagnostics. My name is Genie and I am here to help you answer any questions you may have about diagnosing and solving your problems with your app. Please describe the issue of your app.";
    panelStyles: any;
    width: string = "1200px";
    disableChat: boolean = false;
    constructor() {
        this.panelStyles = {
            root: {
                width: 585,
            },
        };
        this.chatContainerHeight = 0;
        
        this.showTypingMessage = false;
        this.chatContainerHeight = 0;
    }

    ngOnInit() {
        
        this.getMessage();
        this.chatContainerHeight = window.innerHeight - 170;

        this.renderFooter = () => {
            
            let panelTitle = document.createElement('div') as HTMLElement;
            
            panelTitle.innerHTML = "Hi my name is Genie";
            return panelTitle;
            
        };
    }

    getHistoryMessage(): void {
        
    }

    ngOnDestroy() {
        console.log("Genie destroyed");
    }

    closeGeniePanel() {
        
    }

    updateView(event?: any): void {
        this.scrollToBottom();
        if (event && event.hasOwnProperty('data') && event['data'] === "view-loaded" ) {
            (<HTMLInputElement>document.getElementById("genieChatBox")).disabled = false;
        }
    }

    updateStatus(event?: any): void {
       
    }

    scrollToBottom(event?: any): void {
        try {
            this.myScrollContainer.nativeElement.childNodes[0].scrollTop = this.myScrollContainer.nativeElement.childNodes[0].scrollHeight;
        } catch (err) { 
            console.log("scrolltobottom error", err);
        }
    }

    onSearchEnter(event: any): void {
        
    }



    scrollToTop(event?: any): void {
        
        
    }

    getMessage(event?: any): void {
        
    }
}
