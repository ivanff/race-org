import {Routes} from '@angular/router'
import {HomeComponent} from "@src/app/home/home.component"
import {CompetitionComponent} from "@src/app/home/competition/competition.component"
import {StatComponent} from "@src/app/home/stat/stat.component"
import {AboutComponent} from "@src/app/home/about/about.component"
import {EnterComponent} from "@src/app/enter/enter.component"
import {AthletComponent} from "@src/app/athlet/athlet.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {CompetitionDetailComponent} from "@src/app/home/competition/competition-detail/competition-detail.component"
import {AthletResolve} from "@src/app/shared/resolvers/athlet.resolver"
import {AthletDetailComponent} from "@src/app/athlet/athlet-detail/athlet-detail.component"
import {AuthGuard} from "@src/app/web/core/guard/auth.guard"
import {ScanComponent} from "@src/app/scan/scan.component"
import {LocalLogComponent} from "@src/app/scan/local-log/local-log.component"
import {CheckpointResolver} from "@src/app/shared/resolvers/checkpoint.resolver"
import {StartListComponent} from "@src/app/home/start-list/start-list.component"
import {StartListGroupComponent} from "@src/app/home/start-list/start-list-group/start-list-group.component"
import {AthletListResolve} from "@src/app/shared/resolvers/athlet-list.resolver"
import {StartListAddComponent} from "@src/app/home/start-list/start-list-add/start-list-add.component"

export const routes: Routes = [
    {
        path: '',
        component: EnterComponent,
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [
            AuthGuard
        ],
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
            },
            {
                path: "competitions/:parent_competition_id/:competition_id",
                component: CompetitionDetailComponent,
                resolve: {
                    competition: CompetitionResolve,
                }
            },
            {
                path: "start-list",
                component: StartListComponent,
                data: {
                    strict: true
                },
                resolve: {
                    competition: CompetitionResolve
                },
            },
            {
                path: "start-list/add/:class",
                component: StartListAddComponent,
                data: {
                    strict: true
                },
                resolve: {
                    competition: CompetitionResolve,
                    athlets: AthletListResolve,
                },
            },
            {
                path: "start-list/:group",
                component: StartListGroupComponent,
                data: {
                    strict: true
                },
                resolve: {
                    competition: CompetitionResolve,
                    athlets: AthletListResolve,
                }
            },
        ]
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
    {
        path: "scan",
        component: ScanComponent,
        resolve: {
            current_checkpoint: CheckpointResolver,
        }
    },
    {
        path: "scan/local_log",
        component: LocalLogComponent,
        data: {
            strict: true
        },
        resolve: {
            competition: CompetitionResolve
        }
    },
]

