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
import {
    RECAPTCHA_LANGUAGE,
    RECAPTCHA_SETTINGS,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaSettings
} from "ng-recaptcha"

const THIRD_MODULES = [
    DemoMaterialModule,
    FlexLayoutModule,
    NgProgressModule,
    NgProgressRouterModule,
    NgSelectModule,
    NgxMatSelectSearchModule,
    RecaptchaModule,
    RecaptchaFormsModule,
];
const COMPONENTS = [
    BreadcrumbComponent,
    PageHeaderComponent,
    MiniProgressComponent,
    Text3dComponent,
    ErrorCodeComponent,

    AthletRegisterComponent,
    AthletChangeComponent,
    CsvComponent,
    CompetitionComponent,
];
const DIRECTIVES = [];
const PIPES = [
    FilterPipe
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
