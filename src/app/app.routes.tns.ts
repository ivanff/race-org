import {Routes} from '@angular/router'
import {HomeComponent} from "@src/app/home/home.component"
// import {ScanComponent} from "@src/app/scan/scan.component"
import {CompetitionComponent} from "@src/app/competition/competition.component"
import {StatComponent} from "@src/app/home/stat/stat.component"
// import {AdminResolve} from "@src/app/shared/admin.resolver"
// import {LocalLogComponent} from "@src/app/scan/local-log/local-log.component"
import {AboutComponent} from "@src/app/home/about/about.component"
import {EnterComponent} from "@src/app/enter/enter.component"
import {AthletComponent} from "@src/app/athlet/athlet.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {CompetitionDetailComponent} from "@src/app/competition/competition-detail/competition-detail.component"
import {AthletResolve} from "@src/app/shared/resolvers/athlet.resolver"
import {AthletDetailComponent} from "@src/app/athlet/athlet-detail/athlet-detail.component"

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/enter',
        pathMatch: 'full',
    },
    {
        path: 'home',
        component: HomeComponent,
        resolve: {
            competition: CompetitionResolve
        },
        children: [
            {
                path: '',
                component: StatComponent
            },
            {
                path: 'about',
                component: AboutComponent
            },
            {
                path: "competitions",
                component: CompetitionComponent,
            },
            {
                path: "competitions/:competition_id",
                component: CompetitionDetailComponent,
                resolve: {
                    competition: CompetitionResolve
                }
            }
        ]
    }, {
        path: 'enter',
        component: EnterComponent
    },
    {
        path: 'athlets',
        component: AthletComponent,
    },
    {
        path: "athlets/:id",
        component: AthletDetailComponent,
        resolve: {
            athlet: AthletResolve
        }
    },
    // {
    //     path: 'athlets',
    //     component: AthletsComponent
    // },
    // {
    //     path: "athlets/:id",
    //     component: AthletDetailComponent,
    //     resolve: {athlet: AthletResolve}
    // },
    // {
    //     path: "scan",
    //     component: ScanComponent,
    // },
    // {
    //     path: "scan/local_log",
    //     component: LocalLogComponent,
    // },
    // {
    //     path: "options",
    //     component: OptionsComponent,
    //     resolve: {is_admin: AdminResolve}
    // },
]

