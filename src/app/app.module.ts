import {NgModule} from '@angular/core'
import {BrowserModule} from '@angular/platform-browser'

import {AppRoutingModule} from '@src/app/app-routing.module'
import {ResultsComponent} from "@src/app/web/results/results.component"
import {AngularFireModule} from "@angular/fire"
import {environment} from "@src/environments/environment"
import {AngularFirestoreModule} from "@angular/fire/firestore"
import {DemoMaterialModule} from "@src/app/material-module"
import {NgxMaterialTimepickerModule} from "ngx-material-timepicker"
import {BrowserAnimationsModule} from "@angular/platform-browser/animations"
import {AppComponent} from "@src/app/app.component.web"
import {SettingsComponent} from "@src/app/web/settings/settings.component"


@NgModule({
    declarations: [
        AppComponent,
        ResultsComponent,
        SettingsComponent,
    ],
    imports: [
        AngularFireModule.initializeApp(environment.firebase),
        AngularFirestoreModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        DemoMaterialModule,
        NgxMaterialTimepickerModule.setLocale('RU')
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
