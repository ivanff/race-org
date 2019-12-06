import {NgModule} from '@angular/core'
import {SharedModule} from "@src/app/web/shared/shared.module"
import {AppAthletRegisterRoutingModule} from './app-athlet-register-routing.module'
import {AppAthletRegisterComponent, SuccessDialogComponent} from "./app-athlet-register.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {NotificationComponent} from "@src/app/web/theme/admin-layout/notification/notification.component"

const COMPONENTS = [
    AppAthletRegisterComponent,
];
const COMPONENTS_DYNAMIC = [
    SuccessDialogComponent,
];

@NgModule({
    imports: [SharedModule, AppAthletRegisterRoutingModule],
    declarations: [...COMPONENTS, ...COMPONENTS_DYNAMIC, NotificationComponent],
    entryComponents: COMPONENTS_DYNAMIC,
    providers: [
        CompetitionResolve
    ]
})
export class AppAthletRegisterModule {
}
