import {Routes} from '@angular/router'
import {ResultsComponent} from "@src/app/web/results/results.component"
import {SettingsComponent} from "@src/app/web/settings/settings.component"
import {AdminRegisterComponent, RegisterComponent} from "@src/app/web/access/register/register.component"
import {HelpComponent} from "@src/app/web/help/help.component"
import {AdminResolve} from "@src/app/shared/admin.resolver"
import {ResultsPublicComponent} from "@src/app/web/results/results-public/results-public.component"

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/access/register',
        pathMatch: 'full',
    },
    {
        path: 'results',
        component: ResultsComponent,
        resolve: {is_admin: AdminResolve}
    },
    {
        path: 'results/public',
        component: ResultsPublicComponent,
        data: {
            hide_start_time: true,
            hide_class_filter: true
        }
    },
    {
        path: 'list',
        component: ResultsComponent,
        data: {
            hide_start_time: true,
            hide_place: true
        }
    },
    {
        path: 'settings',
        component: SettingsComponent,
        resolve: {is_admin: AdminResolve}
    },
    {
        path: 'access/register',
        component: RegisterComponent
    },
    {
        path: 'access/register/admin',
        component: AdminRegisterComponent,
        resolve: {is_admin: AdminResolve}
    },
    {
        path: 'help',
        component: HelpComponent
    },
]

