import {Routes} from '@angular/router'
import {ResultsComponent} from "@src/app/web/results/results.component"
import {SettingsComponent} from "@src/app/web/settings/settings.component"
import {RegisterComponent} from "@src/app/web/access/register/register.component"
import {HelpComponent} from "@src/app/web/help/help.component"

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/access/register',
        pathMatch: 'full',
    },
    {
        path: 'results',
        component: ResultsComponent
    },
    {
        path: 'list',
        component: ResultsComponent,
        data: {
            hide_start_time: true
        }
    },
    // {
    //     path: 'settings',
    //     component: SettingsComponent
    // },
    {
        path: 'access/register',
        component: RegisterComponent
    },
    {
        path: 'help',
        component: HelpComponent
    },
]

