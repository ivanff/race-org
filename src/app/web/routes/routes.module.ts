import {NgModule} from '@angular/core';
import {SharedModule} from "@src/app/web/shared"
import {DashboardComponent} from "@src/app/web/routes/dashboard/dashboard.component"
import {LoginComponent} from "@src/app/web/routes/sessions/login/login.component"
import {RegisterComponent} from "@src/app/web/routes/sessions/register/register.component"
import {RoutesRoutingModule} from "@src/app/web/routes/routes-routing.module";
import { DashboardAddComponent } from '@src/app/web/routes/dashboard/dashboard-add/dashboard-add.component';
import { DashboardDetailComponent } from '@src/app/web/routes/dashboard/dashboard-detail/dashboard-detail.component';
import { DashboardEditComponent } from '@src/app/web/routes/dashboard/dashboard-edit/dashboard-edit.component'

const COMPONENTS = [
    DashboardComponent,
    DashboardAddComponent,
    LoginComponent,
    // RegisterComponent,
];
const COMPONENTS_DYNAMIC = [];

@NgModule({
    imports: [SharedModule, RoutesRoutingModule],
    declarations: [...COMPONENTS, ...COMPONENTS_DYNAMIC, DashboardAddComponent, DashboardDetailComponent, DashboardEditComponent],
    entryComponents: COMPONENTS_DYNAMIC,
})
export class RoutesModule {
}
