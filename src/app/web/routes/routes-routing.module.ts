import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {environment} from "@src/environments/environment"
import {AdminLayoutComponent} from "@src/app/web/theme/admin-layout/admin-layout.component"
import {DashboardComponent} from "@src/app/web/routes/dashboard/dashboard.component"
import {AuthLayoutComponent} from "@src/app/web/theme/auth-layout/auth-layout.component"
import {LoginComponent} from "@src/app/web/routes/sessions/login/login.component"
import {RegisterComponent} from "@src/app/web/routes/sessions/register/register.component"
import {AuthGuard} from "@src/app/web/core/guard/auth.guard"
import {DashboardAddComponent} from "@src/app/web/routes/dashboard/dashboard-add/dashboard-add.component"
import {ResultsComponent} from "@src/app/web/results/results.component"
import {DashboardDetailComponent} from "@src/app/web/routes/dashboard/dashboard-detail/dashboard-detail.component"

const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: AdminLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            // { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: '',
                component: DashboardComponent,
                data: {title: 'Соревнования', titleI18n: 'dashboard'},
            }, {
                path: 'add',
                component: DashboardAddComponent,
                data: {title: 'Добавить соревнование', titleI18n: 'dashboard'},
            }, {
                path: 'detail',
                component: DashboardDetailComponent,
                data: {title: 'Соревнование', titleI18n: 'dashboard'},
            }, {
                path: 'results',
                component: ResultsComponent,
                data: {},
            },
            {
                path: 'sessions',
                loadChildren: () => import('./sessions/sessions.module').then(m => m.SessionsModule),
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
    {path: '**', redirectTo: 'dashboard'},
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            useHash: environment.useHash,
        }),
    ],
    exports: [RouterModule],
})
export class RoutesRoutingModule {
}
