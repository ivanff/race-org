import {APP_INITIALIZER, LOCALE_ID, NgModule} from '@angular/core'
import {BrowserModule} from '@angular/platform-browser'

import {AppRoutingModule} from '@src/app/app-routing.module'
import {AngularFireModule} from "@angular/fire"
import {environment} from "@src/environments/environment"
import {AngularFirestoreModule} from "@angular/fire/firestore"
import {DemoMaterialModule} from "@src/app/material-module"
import {NgxMaterialTimepickerModule} from "ngx-material-timepicker"
import {BrowserAnimationsModule} from "@angular/platform-browser/animations"
import {AppComponent} from "@src/app/app.component.web"
import {FormsModule, ReactiveFormsModule} from "@angular/forms"
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http"
import {HelpComponent} from "@src/app/web/routes/help/help.component"
import {FlexLayoutModule} from '@angular/flex-layout';
import {
    RECAPTCHA_LANGUAGE,
    RECAPTCHA_SETTINGS,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaSettings
} from 'ng-recaptcha'
import {LocalStorageModule} from "angular-2-local-storage"
import {ResultSetTimeComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-set-time/result-set-time.component"
import {ResultAddMarkComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-add-mark/result-add-mark.component"


import localeRu from '@angular/common/locales/ru'
import {registerLocaleData} from "@angular/common"
import {StartupService} from "@src/app/web/core/services/startup.service"
import {CoreModule} from "@src/app/web/core/core.module"
import {SharedModule} from "@src/app/web/shared"
import {DefaultInterceptor} from "@src/app/web/core"
import {ThemeModule} from "@src/app/web/theme/theme.module"
import {AuthGuard} from "@src/app/web/core/guard/auth.guard"
import {AngularFireAuth} from "@angular/fire/auth"
import {MAT_DATE_LOCALE} from "@angular/material"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {AthletResolve} from "@src/app/shared/resolvers/athlet.resolver"

registerLocaleData(localeRu)

export function StartupServiceFactory(startupService: StartupService) {
    return () => startupService.load();
}

@NgModule({
    entryComponents: [
    ],
    declarations: [
        AppComponent,
        HelpComponent,
    ],
    imports: [
        //ng-matero
        CoreModule,
        SharedModule,
        ThemeModule,

        //
        FlexLayoutModule,
        AngularFireModule.initializeApp(environment.firebase),
        AngularFirestoreModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        DemoMaterialModule,
        HttpClientModule,
        NgxMaterialTimepickerModule.setLocale('RU'),
        LocalStorageModule.forRoot({
            prefix: 'race-org',
            storageType: 'localStorage'
        })
    ],
    providers: [
        {provide: HTTP_INTERCEPTORS, useClass: DefaultInterceptor, multi: true},
        StartupService,
        {
            provide: APP_INITIALIZER,
            useFactory: StartupServiceFactory,
            deps: [StartupService],
            multi: true,
        },
        {
            provide: LOCALE_ID,
            useValue: 'ru'
        },
        {
            provide: MAT_DATE_LOCALE,
            useValue: 'ru'
        },
        AngularFireAuth,
        AuthGuard,

        AthletResolve,
        CompetitionResolve,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
