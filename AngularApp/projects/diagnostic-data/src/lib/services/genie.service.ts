import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GenieGlobals {
    constructor() { }
    messages: any[] = [];
    openGeniePanel: boolean = false;
    openFeedback: boolean = false;
    messagesData: { [id: string]: any } = {};

    // constructor( @Inject(DIAGNOSTIC_DATA_CONFIG) private config: DiagnosticDataConfig) {
    // }
}
