import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppAthletRegisterComponent} from "./app-athlet-register/app-athlet-register.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {PublicCompetitionComponent} from "@src/app/web/routes/public/public-competition/public-competition.component"
import {PublicCompetitionComponentResults} from "@src/app/web/routes/public/public-competition/public-competition-results/public-competition-results.component"
import {PublicCompetitionComponentAthlets} from "@src/app/web/routes/public/public-competition/public-competition-athlets/public-competition-athlets.component"


const routes: Routes = [
  {
    path: 'athlet/register/:id',
    component: AppAthletRegisterComponent,
    resolve: {
      competition: CompetitionResolve
    }
  },
  {
    path: 'competition/:id',
    component: PublicCompetitionComponent,
    resolve: {
      competition: CompetitionResolve
    },
    children: [
      {
        path: '',
        component: PublicCompetitionComponentAthlets,
      },
      {
        path: 'results',
        component: PublicCompetitionComponentResults,
      },
    ]
  },
  {
    path: 'competition/:id/:parent_id',
    component: PublicCompetitionComponent,
    resolve: {
      competition: CompetitionResolve
    },
    children: [
      {
        path: 'results',
        component: PublicCompetitionComponentResults,
      },
    ]
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
