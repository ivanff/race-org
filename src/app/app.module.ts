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
import {AdminRegisterComponent, RegisterComponent} from "@src/app/web/access/register/register.component"
import {FormsModule, ReactiveFormsModule} from "@angular/forms"
import {HttpClientModule} from "@angular/common/http"
import {HelpComponent} from "@src/app/web/help/help.component"
import {AdminResolve} from "@src/app/shared/admin.resolver"
import {Angular2CsvModule} from 'angular2-csv';

import {
    RECAPTCHA_LANGUAGE,
    RECAPTCHA_SETTINGS,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaSettings
} from 'ng-recaptcha'
import {AdminPromptComponent} from "@src/app/web/access/admin-prompt/admin-prompt.component"
import {ResultsPublicComponent} from "@src/app/web/results/results-public/results-public.component"
import {LocalStorageModule} from "angular-2-local-storage"
import {ResultsAdminComponent} from "@src/app/web/results/results-admin/results-admin.component"
import {ResultDetailComponent} from "@src/app/web/results/results-admin/result-detail/result-detail.component"
import {AthletResolve} from "@src/app/shared/athlet.resolver"
import {ResultSetTimeComponent} from "@src/app/web/results/results-admin/result-detail/result-set-time/result-set-time.component"
import {ResultAddMarkComponent} from "@src/app/web/results/results-admin/result-detail/result-add-mark/result-add-mark.component"

@NgModule({
    entryComponents: [
        AdminPromptComponent,
        ResultSetTimeComponent,
        ResultAddMarkComponent,
    ],
    declarations: [
        AppComponent,
        ResultsComponent,
        ResultsAdminComponent,
        ResultDetailComponent,
        ResultsPublicComponent,
        RegisterComponent,
        AdminRegisterComponent,
        HelpComponent,
        SettingsComponent,

        AdminPromptComponent,
        ResultSetTimeComponent,
        ResultAddMarkComponent,
    ],
    imports: [
        AngularFireModule.initializeApp(environment.firebase),
        AngularFirestoreModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        DemoMaterialModule,
        HttpClientModule,
        RecaptchaModule,
        RecaptchaFormsModule,
        Angular2CsvModule,
        NgxMaterialTimepickerModule.setLocale('RU'),
        LocalStorageModule.forRoot({
            prefix: 'race-org',
            storageType: 'localStorage'
        })
    ],
    providers: [
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: {siteKey: '6LfXHrkUAAAAADpcaw0LZFCFsehMD9TxkV9a1mtv'} as RecaptchaSettings,
        },
        {
            provide: RECAPTCHA_LANGUAGE,
            useValue: 'ru', // use French language
        },
        AdminResolve,
        AthletResolve,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
