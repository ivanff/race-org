import {Routes} from '@angular/router'
import {HomeComponent} from "@src/app/home/home.component"
import {AthletsComponent} from "@src/app/athlets/athlets.component"
import {ScanComponent} from "@src/app/scan/scan.component"
import {DetailComponent as AthletDetailComponent} from "@src/app/athlets/detail/detail.component"
import {AthletResolve} from "@src/app/athlets/athlet.resolver"
import {OptionsComponent} from "@src/app/options/options.component"
import {TestComponent} from "@src/app/home/test/test.component"
import {Test2Component} from "@src/app/home/test2/test2.component"
import {CompetitionComponent} from "@src/app/competition/competition.component"

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
    },
    {
        path: 'home',
        component: HomeComponent,
        children: [
            {
                path: '',
                component: TestComponent
            },
            {
                path: 'test2',
                component: Test2Component
            }
        ]
    },
    {
        path: 'athlets',
        component: AthletsComponent
    },
    {
        path: "athlets/:phone",
        component: AthletDetailComponent,
        resolve: {athlet: AthletResolve}
    },
    {
        path: "scan",
        component: ScanComponent,
    },
    {
        path: "options",
        component: OptionsComponent,
    },
    {
        path: "competition",
        component: CompetitionComponent,
        outlet: "root"
    }
]

