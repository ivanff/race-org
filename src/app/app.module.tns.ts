import {APP_INITIALIZER, NgModule, NO_ERRORS_SCHEMA} from '@angular/core'
import {NativeScriptModule} from 'nativescript-angular/nativescript.module'

import {AppRoutingModule} from '@src/app/app-routing.module'
import {AppComponent} from '@src/app/app.component'
import {HomeComponent} from "@src/app/home/home.component"
import {NativeScriptUISideDrawerModule} from "nativescript-ui-sidedrawer/angular"
import {NativeScriptLocalizeModule} from "nativescript-localize/localize.module"
import {NativeScriptUIListViewModule} from "nativescript-ui-listview/angular"
import {AthletsComponent} from "@src/app/athlets/athlets.component"
import {FilterPipe} from "@src/app/shared/filter.pipe"
import {DetailComponent} from "@src/app/athlets/detail/detail.component"
import {AthletResolve} from "@src/app/athlets/athlet.resolver"
import {RootComponent} from "@src/app/root/root.component"
import {ScanComponent} from "@src/app/scan/scan.component"
import {OptionsComponent} from "@src/app/options/options.component"
import {TestComponent} from "@src/app/home/test/test.component"
import {Test2Component} from "@src/app/home/test2/test2.component"
import {CompetitionComponent} from "@src/app/competition/competition.component"
import {SettingsService} from "@src/app/shared/settings.service"


// Uncomment and add to NgModule imports if you need to use two-way binding
// import { NativeScriptFormsModule } from 'nativescript-angular/forms'

// Uncomment and add to NgModule imports  if you need to use the HTTP wrapper
// import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client'

@NgModule({
    entryComponents: [
        RootComponent
    ],
    declarations: [
        AppComponent,
        AthletsComponent,
        DetailComponent,
        ScanComponent,
        OptionsComponent,
        CompetitionComponent,
        RootComponent,
        TestComponent,
        Test2Component,
        HomeComponent,
        FilterPipe,
    ],
    imports: [
        NativeScriptLocalizeModule,
        NativeScriptUIListViewModule,
        NativeScriptUISideDrawerModule,
        NativeScriptModule,
        AppRoutingModule,
    ],
    providers: [
        AthletResolve,
        SettingsService,
    ],
    bootstrap: [AppComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {
}
