import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

import {FlexLayoutModule} from '@angular/flex-layout';

import {BreadcrumbComponent} from './components/breadcrumb/breadcrumb.component';
import {PageHeaderComponent} from './components/page-header/page-header.component';
import {MiniProgressComponent} from './components/mini-progress/mini-progress.component';
import {Text3dComponent} from './components/text3d/text3d.component';
import {ErrorCodeComponent} from './components/error-code/error-code.component';
import {DemoMaterialModule} from "@src/app/material-module"
import {NgSelectModule} from "@ng-select/ng-select"
import {NgProgressModule} from "ngx-progressbar"
import {NgProgressRouterModule} from "@ngx-progressbar/router"
import {NgxMatSelectSearchModule} from "ngx-mat-select-search"
import {CompetitionComponent} from "@src/app/web/shared/components/competition/competition.component"
import {FilterPipe} from "@src/app/shared/pipes/filter.pipe"
import {CsvComponent} from "@src/app/web/shared/components/csv/csv.component"
import {AthletChangeComponent} from "@src/app/web/shared/components/athlet/athlet-change.component"
import {AthletRegisterComponent} from "@src/app/web/shared/components/athlet/athlet-register.component"
import {QRCodeModule} from 'angular2-qrcode'
import {
    RECAPTCHA_LANGUAGE,
    RECAPTCHA_SETTINGS,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaSettings
} from "ng-recaptcha"
import {ChartsModule} from "ng2-charts"
import {AthletAddComponent} from "@src/app/web/shared/components/athlet/athlet-add.component"
import {TzDateFinishPipe, TzDatePipe, TzDateStartPipe} from "@src/app/shared/pipes/tzdate.pipe"
import {ResultsComponent} from "@src/app/web/routes/results/results.component"
import {ResultsLockComponent} from "@src/app/web/routes/results/results-lock.component"
import {OrderModule} from "ngx-order-pipe"

const THIRD_MODULES = [
    DemoMaterialModule,
    FlexLayoutModule,
    NgProgressModule,
    NgProgressRouterModule,
    NgSelectModule,
    NgxMatSelectSearchModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    QRCodeModule,
    ChartsModule,
    OrderModule,
];
const COMPONENTS = [
    ResultsComponent,
    ResultsLockComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    MiniProgressComponent,
    Text3dComponent,
    ErrorCodeComponent,

    AthletRegisterComponent,
    AthletChangeComponent,
    AthletAddComponent,
    CsvComponent,
    CompetitionComponent,
];
const DIRECTIVES = [];
const PIPES = [
    FilterPipe,
    TzDatePipe,
    TzDateStartPipe,
    TzDateFinishPipe,
];

@NgModule({
    declarations: [...COMPONENTS, ...DIRECTIVES, ...PIPES],
    imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, ...THIRD_MODULES],
    exports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ReactiveFormsModule,
        ...THIRD_MODULES,
        ...COMPONENTS,
        ...DIRECTIVES,
        ...PIPES,
    ],
    providers: [
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: {siteKey: '6LfXHrkUAAAAADpcaw0LZFCFsehMD9TxkV9a1mtv'} as RecaptchaSettings,
        },
        {
            provide: RECAPTCHA_LANGUAGE,
            useValue: 'ru',
        },
    ]
})
export class SharedModule {
}
