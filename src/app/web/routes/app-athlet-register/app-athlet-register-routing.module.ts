import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppAthletRegisterComponent} from "./app-athlet-register.component"
import {CompetitionResolve} from "@src/app/shared/resolvers/competition.resolver"


const routes: Routes = [
  {
    path: 'athlet/register/:id',
    component: AppAthletRegisterComponent,
    resolve: {
      competition: CompetitionResolve
    }
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppAthletRegisterRoutingModule {}
