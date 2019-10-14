import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core'
import {NativeScriptModule} from 'nativescript-angular/nativescript.module'

import {AppRoutingModule} from '@src/app/app-routing.module'
import {AppComponent} from '@src/app/app.component'
import {HomeComponent} from "@src/app/home/home.component"
import {NativeScriptUISideDrawerModule} from "nativescript-ui-sidedrawer/angular"
import {NativeScriptLocalizeModule} from "nativescript-localize/localize.module"
import {NativeScriptUIListViewModule} from "nativescript-ui-listview/angular"
import {AthletsComponent} from "@src/app/athlets/athlets.component"
import {FilterPipe} from "@src/app/shared/pipes/filter.pipe"
import {DetailComponent} from "@src/app/athlets/detail/detail.component"
import {RootComponent} from "@src/app/root/root.component"
import {ScanComponent} from "@src/app/scan/scan.component"
import {OptionsComponent} from "@src/app/options/options.component"
import {CompetitionComponent} from "@src/app/competition/competition.component"
import {SettingsService} from "@src/app/shared/settings.service"
import {FoundDialogComponent} from "@src/app/scan/found-dialog/found-dialog.component"
import {StatComponent} from "@src/app/home/stat/stat.component"
import {OrderModule} from "ngx-order-pipe"
import {AdminResolve} from "@src/app/shared/admin.resolver"
import {BaseComponent} from "@src/app/shared/base.component"
import {LocalLogComponent} from "@src/app/scan/local-log/local-log.component"
import {AboutComponent} from "@src/app/home/about/about.component"
import {AthletResolve} from "@src/app/shared/athlet.resolver";
import { DashboardAddComponent } from '@src/app/web/routes/dashboard/dashboard-add/dashboard-add.component'
import {ReactiveFormsModule} from "@angular/forms";
import { DashboardDetailComponent } from '@src/app/web/routes/dashboard/dashboard-detail/dashboard-detail.component';
import { DashboardEditComponent } from '@src/app/web/routes/dashboard/dashboard-edit/dashboard-edit.component'


// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from 'nativescript-angular/forms'

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client'

@NgModule({
    entryComponents: [
        RootComponent,
        FoundDialogComponent,
    ],
    declarations: [
        BaseComponent,
        AppComponent,
        AthletsComponent,
        DetailComponent,
        ScanComponent,
        LocalLogComponent,
        OptionsComponent,
        CompetitionComponent,
        RootComponent,
        StatComponent,
        AboutComponent,
        HomeComponent,
        FilterPipe,
        FoundDialogComponent,
        DashboardAddComponent,
        DashboardDetailComponent,
        DashboardEditComponent,
    ],
    imports: [
        NativeScriptLocalizeModule,
        NativeScriptUIListViewModule,
        NativeScriptUISideDrawerModule,
        NativeScriptModule,
        AppRoutingModule,
        OrderModule,
        ReactiveFormsModule,
    ],
    providers: [
        AthletResolve,
        AdminResolve,
        SettingsService,
    ],
    bootstrap: [AppComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {
}
