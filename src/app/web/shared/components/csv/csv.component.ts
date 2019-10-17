import {Component} from '@angular/core';
import {Angular2CsvComponent} from 'angular2-csv';

@Component({
    selector: 'csv',
    template: '<span (click)=\"onDownload()\"><ng-content></ng-content></span>',
})
export class CsvComponent extends Angular2CsvComponent {
}
