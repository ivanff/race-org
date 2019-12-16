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
import {CompetitionComponent} from "@src/app/home/competition/competition.component"
import {StartListGroupComponent} from "@src/app/start-list/start-list-group/start-list-group.component"
import {StartListAddDialogComponent} from "@src/app/start-list/start-list-add-dialog/start-list-add-dialog.component"
import {StatComponent} from "@src/app/home/stat/stat.component"
import {OrderModule} from "ngx-order-pipe"
import {AdminResolve} from "@src/app/shared/admin.resolver"
import {BaseComponent} from "@src/app/shared/base.component"
import {AboutComponent} from "@src/app/home/about/about.component"
import {ReactiveFormsModule} from "@angular/forms";
import {AthletResolve} from "@src/app/shared/resolvers/athlet.resolver"
import {EnterComponent} from "@src/app/enter/enter.component"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {CompetitionDetailComponent} from "@src/app/home/competition/competition-detail/competition-detail.component"
import {CompetitionDetailQrComponent} from "@src/app/home/competition/competition-detail/competition-detail-qr/competition-detail-qr.component"
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
import {CheckpointResolver} from "@src/app/shared/resolvers/checkpoint.resolver"
import {EnterSecretComponent} from "@src/app/enter/enter-secret/enter-secret.component"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {TzDateFinishPipe, TzDatePipe, TzDateStartPipe} from "@src/app/shared/pipes/tzdate.pipe"
import {NfcService} from "@src/app/mobile/services/nfc.service"
import {BarcodeService} from "@src/app/mobile/services/barcode.service"


// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from 'nativescript-angular/forms'

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
import {NativeScriptHttpClientModule} from 'nativescript-angular/http-client'
import {StartListTabItemComponent} from "@src/app/start-list/start-list-tab-item.component"
import {StartListComponent} from "@src/app/start-list/start-list.component"
import {StartListTabsComponent} from "@src/app/start-list/start-list-tabs.component"
import {HasGroupPipe} from "@src/app/shared/pipes/hasGroup.pipe"
import {RadListSwipeComponent} from "@src/app/shared/rad-list-swipe.component"
import {AthletListResolve} from "@src/app/shared/resolvers/athlet-list.resolver"


@NgModule({
    entryComponents: [
        RootComponent,
        CompetitionDetailQrComponent,
        StartListTabItemComponent,
        StartListAddDialogComponent,
    ],
    declarations: [
        BaseComponent,
        RadListSwipeComponent,
        AppComponent,
        RootComponent,

        EnterComponent,
        EnterSecretComponent,

        HomeComponent,
        StatComponent,
        AboutComponent,

        AthletComponent,
        AthletDetailComponent,

        ScanComponent,
        LocalLogComponent,

        CompetitionComponent,
        CompetitionDetailComponent,
        CompetitionDetailQrComponent,

        StartListComponent,
        StartListTabsComponent,
        StartListTabItemComponent,
        StartListGroupComponent,
        StartListAddDialogComponent,

        FilterPipe,
        DeviceNamePipe,
        GetDevicePipe,
        HasGroupPipe,
        JoinPipe,
        TzDatePipe,
        TzDateStartPipe,
        TzDateFinishPipe,
        // FoundDialogComponent
    ],
    imports: [
        NativeScriptLocalizeModule,
        NativeScriptUIListViewModule,
        NativeScriptUISideDrawerModule,
        NativeScriptHttpClientModule,
        NativeScriptModule,
        AppRoutingModule,
        OrderModule,
        ReactiveFormsModule,
    ],
    providers: [
        CompetitionResolve,
        AthletResolve,
        AthletListResolve,
        AdminResolve,
        AuthResolve,
        CheckpointResolver,

        AuthGuard,

        SnackbarService,
        CompetitionService,
        SqliteService,
        NfcService,
        BarcodeService,
        AuthService,
    ],
    bootstrap: [AppComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {
}
