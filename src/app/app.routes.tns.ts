import {Routes} from '@angular/router'
import {HomeComponent} from "@src/app/home/home.component"
import {AthletsComponent} from "@src/app/athlets/athlets.component"
import {ScanComponent} from "@src/app/scan/scan.component"
import {DetailComponent as AthletDetailComponent} from "@src/app/athlets/detail/detail.component"
import {OptionsComponent} from "@src/app/options/options.component"
import {CompetitionComponent} from "@src/app/competition/competition.component"
import {StatComponent} from "@src/app/home/stat/stat.component"
import {AdminResolve} from "@src/app/shared/admin.resolver"
import {LocalLogComponent} from "@src/app/scan/local-log/local-log.component"
import {AboutComponent} from "@src/app/home/about/about.component"
import {AthletResolve} from "@src/app/shared/athlet.resolver"

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
                component: StatComponent
            },
            {
                path: 'about',
                component: AboutComponent
            }
        ]
    },
    {
        path: 'athlets',
        component: AthletsComponent
    },
    {
        path: "athlets/:id",
        component: AthletDetailComponent,
        resolve: {athlet: AthletResolve}
    },
    {
        path: "scan",
        component: ScanComponent,
    },
    {
        path: "scan/local_log",
        component: LocalLogComponent,
    },
    {
        path: "options",
        component: OptionsComponent,
        resolve: {is_admin: AdminResolve}
    },
    {
        path: "competition",
        component: CompetitionComponent,
        outlet: "root"
    }
]

