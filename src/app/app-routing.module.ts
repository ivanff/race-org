import {NgModule} from '@angular/core';
import {SharedModule} from "@src/app/web/shared"
import {DashboardComponent} from "@src/app/web/routes/dashboard/dashboard.component"
import {LoginComponent} from "@src/app/web/routes/sessions/login/login.component"
// import {RegisterComponent} from "@src/app/web/routes/sessions/register/register.component"
import {DashboardAddComponent} from '@src/app/web/routes/dashboard/dashboard-add/dashboard-add.component';
import {DashboardDetailComponent} from '@src/app/web/routes/dashboard/dashboard-detail/dashboard-detail.component';
import {RoutesRoutingModule} from "@src/app/app.routes"
import {DashboardEditComponent} from "@src/app/web/routes/dashboard/dashboard-edit/dashboard-edit.component"
import {ResultsAdminComponent} from "@src/app/web/routes/results/results-admin/results-admin.component"
import {ResultDetailComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-detail.component"
import {ResultSetTimeComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-set-time/result-set-time.component"
import {ResultAddMarkComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-add-mark/result-add-mark.component"
import {ResultsComponent} from "@src/app/web/routes/results/results.component"

const COMPONENTS = [
    DashboardComponent,
    DashboardDetailComponent,
    DashboardEditComponent,
    DashboardAddComponent,

    ResultsComponent,
    ResultsAdminComponent,
    ResultDetailComponent,
    ResultAddMarkComponent,
    ResultSetTimeComponent,

    LoginComponent,

    // RegisterComponent,
];
const COMPONENTS_DYNAMIC = [
    ResultAddMarkComponent,
    ResultSetTimeComponent,
];

@NgModule({
    imports: [SharedModule, RoutesRoutingModule],
    declarations: [...COMPONENTS, ...COMPONENTS_DYNAMIC],
    entryComponents: COMPONENTS_DYNAMIC,
})
export class AppRoutingModule {
}
