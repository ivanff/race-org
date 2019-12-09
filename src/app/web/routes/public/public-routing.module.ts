import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppAthletRegisterComponent} from "./app-athlet-register/app-athlet-register.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"
import {PublicCompetitionComponent} from "@src/app/web/routes/public/public-competition/public-competition.component"


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
    }
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
