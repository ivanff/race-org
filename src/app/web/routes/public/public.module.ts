import {NgModule} from '@angular/core'
import {SharedModule} from "@src/app/web/shared/shared.module"
import {PublicRoutingModule} from './public-routing.module'
import {AppAthletRegisterComponent, SuccessDialogComponent} from "./app-athlet-register/app-athlet-register.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {NotificationComponent} from "@src/app/web/theme/admin-layout/notification/notification.component"
import {PublicCompetitionComponent} from "@src/app/web/routes/public/public-competition/public-competition.component"
import {PublicCompetitionComponentResults} from "@src/app/web/routes/public/public-competition/public-competition-results/public-competition-results.component"
import {PublicCompetitionComponentAthlets} from "@src/app/web/routes/public/public-competition/public-competition-athlets/public-competition-athlets.component"

const COMPONENTS = [
    AppAthletRegisterComponent,
    PublicCompetitionComponent,
    PublicCompetitionComponentResults,
    PublicCompetitionComponentAthlets,
];
const COMPONENTS_DYNAMIC = [
    SuccessDialogComponent,
];

@NgModule({
    imports: [SharedModule, PublicRoutingModule],
    declarations: [...COMPONENTS, ...COMPONENTS_DYNAMIC, NotificationComponent],
    entryComponents: COMPONENTS_DYNAMIC,
    providers: [
        CompetitionResolve
    ]
})
export class PublicModule {
}
