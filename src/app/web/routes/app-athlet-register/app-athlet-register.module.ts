import {NgModule} from '@angular/core'
import {SharedModule} from "@src/app/web/shared/shared.module"
import {AppAthletRegisterRoutingModule} from './app-athlet-register-routing.module'
import {AppAthletRegisterComponent} from "./app-athlet-register.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"

const COMPONENTS = [
    AppAthletRegisterComponent,
];
const COMPONENTS_DYNAMIC = [];

@NgModule({
    imports: [SharedModule, AppAthletRegisterRoutingModule],
    declarations: [...COMPONENTS, ...COMPONENTS_DYNAMIC],
    entryComponents: COMPONENTS_DYNAMIC,
    providers: [
        CompetitionResolve
    ]
})
export class AppAthletRegisterModule {
}
