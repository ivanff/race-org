import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core'
import {NativeScriptModule} from 'nativescript-angular/nativescript.module'

import {AppRoutingModule} from '@src/app/app-routing.module'
import {AppComponent} from '@src/app/app.component'
import {HomeComponent} from "@src/app/home/home.component"
import {NativeScriptUISideDrawerModule} from "nativescript-ui-sidedrawer/angular"
import {NativeScriptLocalizeModule} from "nativescript-localize/localize.module"
import {NativeScriptUIListViewModule} from "nativescript-ui-listview/angular"
import {FilterPipe} from "@src/app/shared/pipes/filter.pipe"
import {RootComponent} from "@src/app/root/root.component"
// import {ScanComponent} from "@src/app/scan/scan.component"
import {CompetitionComponent} from "@src/app/competition/competition.component"
// import {FoundDialogComponent} from "@src/app/scan/found-dialog/found-dialog.component"
import {StatComponent} from "@src/app/home/stat/stat.component"
import {OrderModule} from "ngx-order-pipe"
import {AdminResolve} from "@src/app/shared/admin.resolver"
import {BaseComponent} from "@src/app/shared/base.component"
// import {LocalLogComponent} from "@src/app/scan/local-log/local-log.component"
import {AboutComponent} from "@src/app/home/about/about.component"
import {ReactiveFormsModule} from "@angular/forms";
import {AthletResolve} from "@src/app/shared/resolvers/athlet.resolver"
import {EnterComponent} from "@src/app/enter/enter.component"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {CompetitionDetailComponent} from "@src/app/competition/competition-detail/competition-detail.component"
import {DeviceNamePipe} from "@src/app/shared/pipes/device-name.pipe"
import {GetDevicePipe} from "@src/app/shared/pipes/get-device.pipe"
import {SqliteService} from "@src/app/mobile/services/sqlite.service"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {AthletDetailComponent} from "@src/app/athlet/athlet-detail/athlet-detail.component"
import {AthletComponent} from "@src/app/athlet/athlet.component"
import {AuthResolve} from "@src/app/shared/resolvers/auth.resolver"
import {AuthGuard} from "@src/app/web/core/guard/auth.guard"
import {ScanComponent} from "@src/app/scan/scan.component"
import {JoinPipe} from "@src/app/shared/pipes/join.pipe"
import {LocalLogComponent} from "@src/app/scan/local-log/local-log.component"


// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from 'nativescript-angular/forms'

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client'

@NgModule({
    entryComponents: [
        RootComponent,
        // FoundDialogComponent,
    ],
    declarations: [
        BaseComponent,
        AppComponent,
        RootComponent,

        EnterComponent,
        HomeComponent,
        StatComponent,
        AboutComponent,

        AthletComponent,
        AthletDetailComponent,
        ScanComponent,
        LocalLogComponent,
        CompetitionComponent,
        CompetitionDetailComponent,

        FilterPipe,
        DeviceNamePipe,
        GetDevicePipe,
        JoinPipe,
        // FoundDialogComponent
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
        CompetitionResolve,
        AthletResolve,
        AdminResolve,
        AuthResolve,

        AuthGuard,

        CompetitionService,
        SqliteService,
        AuthService,
    ],
    bootstrap: [AppComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {
}
