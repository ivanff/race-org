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

const THIRD_MODULES = [
    DemoMaterialModule,
    FlexLayoutModule,
    NgProgressModule,
    NgProgressRouterModule,
    NgSelectModule,
];
const COMPONENTS = [
    BreadcrumbComponent,
    PageHeaderComponent,
    MiniProgressComponent,
    Text3dComponent,
    ErrorCodeComponent,
];
const DIRECTIVES = [];
const PIPES = [];

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
})
export class SharedModule {
}
