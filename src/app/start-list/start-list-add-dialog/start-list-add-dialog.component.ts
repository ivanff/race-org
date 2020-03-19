import {
    Component
} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {TextField} from "@nativescript/core/ui/text-field"
import {DialogComponent} from "@src/app/shared/dialog.component"
import {groupNumberMatch, sortNumber} from "@src/app/shared/helpers"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Competition} from "@src/app/shared/interfaces/competition"
import {firestore} from "nativescript-plugin-firebase"

const firebase = require('nativescript-plugin-firebase/app')
import * as _ from "lodash"
import {hasOwnProperty} from "tslint/lib/utils"
import GetOptions = firestore.GetOptions
import {DocumentSnapshot} from "firebase"

@Component({
    selector: 'app-start-list-add-dialog',
    templateUrl: './start-list-add-dialog.component.html'
})
export class StartListAddDialogComponent extends DialogComponent {
    size: number

    constructor(public params: ModalDialogParams,
                private _competition: CompetitionService) {
        super(params)
    }

    onSizeChange($event): void {
        const textField = <TextField>$event.object
        this.size = parseInt(textField.text)
    }

    onSplitBySize(): void {
        this.onClose({
            action: 'size',
            value: this.size
        })
    }

    onSplitByStage(): void {
        const promises: Array<Promise<firestore.QuerySnapshot>> = []
        if (this._competition.selected_competition.parent_id) {
            promises.push(
                firebase.firestore().collection('competitions')
                    .doc(this._competition.selected_competition.parent_id)
                    .get({source: 'server'} as GetOptions).then((doc: firestore.DocumentSnapshot) => {
                        if (doc.exists) {
                            return [doc]
                        }
                        return []
                    })
            )
            promises.push(
                firebase.firestore().collection('competitions')
                    .doc(this._competition.selected_competition.parent_id)
                    .collection('stages')
                    .where('lock_results', '==', true)
                    .get({source: 'server'} as GetOptions)
            )
        }

        Promise.all(promises).then((collections: Array<firestore.QuerySnapshot | Array<firestore.DocumentSnapshot>>) => {
            const competitions = _.orderBy(
                _.flatten(collections.map((collection: firestore.QuerySnapshot | Array<firestore.DocumentSnapshot>) => {
                    const results: Array<Competition> = []
                    collection.forEach((doc: firestore.DocumentSnapshot) => {
                        const id = doc.id
                        const competition = {id, ...doc.data()} as Competition
                        if (
                            (competition.results || {}).hasOwnProperty(this.params.context['_class']) &&
                            competition.lock_results &&
                            competition.id != this._competition.selected_competition.id
                        ) {
                            results.push(competition)
                        }
                    })

                    return results
                })
            ), 'created')

            if (competitions.length) {
                const placeMap:{[key:number]: number} = {}

                competitions.forEach((competition: Competition, index: number) => {

                    if (true) {
                        if (index < (competitions.length - 1)) {
                            return
                        }
                    }

                    (competition.results[this.params.context['_class']].data || []).map((item) => {
                        let score = item.score

                        if (!score) {
                            score = index / 1000
                        }

                        if (!placeMap.hasOwnProperty(item.athlet.id)) {
                            placeMap[item.athlet.id] = score
                        } else {
                            placeMap[item.athlet.id] += score
                        }
                    })
                })

                this.onClose({
                    action: 'stage',
                    value: this.size,
                    results: placeMap
                })
            } else {
                this.onClose({
                    action: 'stage',
                    value: this.size,
                    results: null
                })
            }

        })

        // this.onClose({
        //     action: 'stage',
        //     value: this.size
        // })
    }

    onAddGroup(): void {
        const groupsKeys: Array<string> = this.params.context['groupsKeys']
        const groupNumbers: Array<number> = groupsKeys.map((item: string) => groupNumberMatch(item)).filter((item) => item > -1).sort(sortNumber)

        let next = 0

        if (groupNumbers.length) {
            next = groupNumbers[groupNumbers.length-1] + 1
        }

        this.onClose({
            action: 'navigate',
            value: ['add', this.params.context['_class'], `${this.params.context['_class']}_${next}`]
        })
    }
}
