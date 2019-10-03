import {NgModule} from '@angular/core';
import {SharedModule} from "@src/app/web/shared"
import {DashboardComponent} from "@src/app/web/routes/dashboard/dashboard.component"
import {LoginComponent} from "@src/app/web/routes/sessions/login/login.component"
import {RegisterComponent} from "@src/app/web/routes/sessions/register/register.component"
import {RoutesRoutingModule} from "@src/app/web/routes/routes-routing.module"

const COMPONENTS = [DashboardComponent, LoginComponent, RegisterComponent];
const COMPONENTS_DYNAMIC = [];

@NgModule({
    imports: [SharedModule, RoutesRoutingModule],
    declarations: [...COMPONENTS, ...COMPONENTS_DYNAMIC],
    entryComponents: COMPONENTS_DYNAMIC,
})
export class RoutesModule {
}
