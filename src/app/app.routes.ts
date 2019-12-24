import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {environment} from "@src/environments/environment"
import {AdminLayoutComponent} from "@src/app/web/theme/admin-layout/admin-layout.component"
import {DashboardComponent} from "@src/app/web/routes/dashboard/dashboard.component"
import {AuthLayoutComponent} from "@src/app/web/theme/auth-layout/auth-layout.component"
import {LoginComponent} from "@src/app/web/routes/sessions/login/login.component"
import {AuthGuard} from "@src/app/web/core/guard/auth.guard"
import {DashboardAddComponent} from "@src/app/web/routes/dashboard/dashboard-add/dashboard-add.component"
import {DashboardDetailComponent} from "@src/app/web/routes/dashboard/dashboard-detail/dashboard-detail.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {ResultsAdminComponent} from "@src/app/web/routes/results/results-admin/results-admin.component"
import {ResultDetailComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-detail.component"
import {AthletResolve} from "@src/app/shared/resolvers/athlet.resolver"
import {DashboardEditComponent} from "@src/app/web/routes/dashboard/dashboard-edit/dashboard-edit.component"
import {PrivatePolicyComponent} from "@src/app/web/routes/private-policy/private-policy.component"

const routes: Routes = [
    // {
    //     path: '',
    //     redirectTo: 'auth/login',
    //     pathMatch: 'full'
    // },
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [
            AuthGuard
        ],
        children: [
            {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: {title: 'Соревнования', titleI18n: 'Competitions'},
            }, {
                path: 'add',
                component: DashboardAddComponent,
                data: {title: 'Добавить соревнование', titleI18n: 'Add competition'},
            }, {
                path: 'edit',
                redirectTo: 'dashboard'
            }, {
                path: 'edit/:id',
                component: DashboardDetailComponent,
                data: {title: 'Соревнование', titleI18n: 'Competition'},
                resolve: {
                    competition: CompetitionResolve
                }
            }, {
                path: 'edit/:id/detail/:athlet_id',
                component: DashboardEditComponent,
                resolve: {
                    competition: CompetitionResolve,
                    athlet: AthletResolve,
                }
            }, {
                path: 'results/:id',
                component: ResultsAdminComponent,
                data: {
                    title: 'Результат',
                    titleI18n: 'Result',
                    //TODO
                    is_admin: true,
                },
                resolve: {
                    competition: CompetitionResolve,
                }
            }, {
                path: 'results/:id/detail/:athlet_id',
                component: ResultDetailComponent,
                resolve: {
                    competition: CompetitionResolve,
                    athlet: AthletResolve,
                }
            },
        ],
    },
    {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent,
                data: {title: 'Вход', titleI18n: 'Login'},
            },
            // {
            //     path: 'register',
            //     component: RegisterComponent,
            //     data: {title: 'Регистрация', titleI18n: 'Register'},
            // },
        ],
    }, {
        path: 'public',
        loadChildren: () => import('@src/app/web/routes/public/public.module').then(m => m.PublicModule),
    },
    {
        path: 'private_policy',
        component: PrivatePolicyComponent
    },
    // {
    //     path: 'athlet/register/:id',
    //     component: AppAthletRegisterComponent,
    //     resolve: {
    //         competition: CompetitionResolve
    //     }
    // },
    {path: '**', redirectTo: 'dashboard'},
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            useHash: environment.useHash,
            // enableTracing: true
        }),
    ],
    exports: [RouterModule],
})
export class RoutesRoutingModule {
}
