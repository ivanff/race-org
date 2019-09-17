import {Routes} from '@angular/router'
import {ResultsComponent} from "@src/app/web/results/results.component"
import {SettingsComponent} from "@src/app/web/settings/settings.component"

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/results',
        pathMatch: 'full',
    },
    {
        path: 'results',
        component: ResultsComponent
    },
    {
        path: 'settings',
        component: SettingsComponent
    },
]

