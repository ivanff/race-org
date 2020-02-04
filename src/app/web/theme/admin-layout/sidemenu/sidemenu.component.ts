import {Component, Input} from '@angular/core'
import {ChildrenItem, MenuService} from "@src/app/web/core/services/menu.service"
import {SettingsService} from "@src/app/web/core"
import {Competition} from "@src/app/shared/interfaces/competition"
import * as moment from "moment-timezone"
import {BehaviorSubject} from "rxjs"

@Component({
    selector: 'app-sidemenu',
    templateUrl: './sidemenu.component.html',
})
export class SidemenuComponent {
    // NOTE: Ripple effect make page flashing on mobile
    @Input() ripple = true;

    menus$ = new BehaviorSubject(this.menuService.getAll())

    constructor(private menuService: MenuService,
                private settings: SettingsService) {
        settings.competitions$.subscribe((competitions: Array<Competition>) => {
            let menu_competitions: Array<ChildrenItem> = []
            let menu_results: Array<ChildrenItem> = []
            competitions.forEach((competition: Competition) => {
                if (competition.start_date.toDate() < moment.utc().startOf('day').toDate()) {
                    menu_results.push({
                        "state": ['results', competition.id],
                        "name": competition.title,
                        "type": "state"
                    } as ChildrenItem)

                    if (competition.stages) {
                        competition.stages.forEach((stage: Competition) => {
                            menu_results.push({
                                "state": ['results', stage.id, competition.id],
                                "name": `${stage.title}`,
                                "icon": 'location_on',
                                "type": "state"
                            })
                        })
                    }


                }
                menu_competitions.push({
                    "state": ['edit', competition.id],
                    "name": competition.title,
                    "type": "state"
                } as ChildrenItem)
            })

            this.menuService.setChildren('edit', menu_competitions)
            this.menuService.setChildren('results', menu_results)

            this.menus$.next(this.menuService.getAll())
        })
    }

    // Delete empty value in array
    filterStates(states: string[]) {
        return states.filter(item => item && item.trim());
    }
}
