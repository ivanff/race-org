import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {environment} from "@src/environments/environment"
import {AdminLayoutComponent} from "@src/app/web/theme/admin-layout/admin-layout.component"
import {DashboardComponent} from "@src/app/web/routes/dashboard/dashboard.component"
import {AuthLayoutComponent} from "@src/app/web/theme/auth-layout/auth-layout.component"
import {LoginComponent} from "@src/app/web/routes/sessions/login/login.component"
// import {RegisterComponent} from "@src/app/web/routes/sessions/register/register.component"
import {AuthGuard} from "@src/app/web/core/guard/auth.guard"
import {DashboardAddComponent} from "@src/app/web/routes/dashboard/dashboard-add/dashboard-add.component"
import {DashboardDetailComponent} from "@src/app/web/routes/dashboard/dashboard-detail/dashboard-detail.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition"
import {ResultsAdminComponent} from "@src/app/web/routes/results/results-admin/results-admin.component"
import {ResultDetailComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-detail.component"
import {AthletResolve} from "@src/app/shared/athlet.resolver"
import {AppAthletRegisterComponent} from "@src/app/web/routes/app-athlet-register/app-athlet-register.component"
import {DashboardEditComponent} from "@src/app/web/routes/dashboard/dashboard-edit/dashboard-edit.component"

const routes: Routes = [
    // {
    //     path: '',
    //     redirectTo: 'auth/login',
    //     pathMatch: 'full'
    // },
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: {title: 'Соревнования', titleI18n: 'dashboard'},
            }, {
                path: 'add',
                component: DashboardAddComponent,
                data: {title: 'Добавить соревнование', titleI18n: 'dashboard'},
            }, {
                path: 'edit',
                redirectTo: 'dashboard'
            }, {
                path: 'edit/:id',
                component: DashboardDetailComponent,
                data: {title: 'Соревнование', titleI18n: 'dashboard'},
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
                    is_admin: true
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
            {
                path: 'sessions',
                loadChildren: () => import('@src/app/web/routes/sessions/sessions.module').then(m => m.SessionsModule),
                data: {title: 'Sessions', titleI18n: 'Sessions'},
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
    },
    {
        path: 'athlet/register/:id',
        component: AppAthletRegisterComponent,
        resolve: {
            competition: CompetitionResolve
        }
    },
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
