import {ResultMark as Mark} from "@src/app/web/routes/results/results.component"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {PublicTableAthletRow} from "@src/app/web/routes/public/public-competition/public-competition-athlets/public-competition-athlets.component"
import {PublicTableResultRow} from "@src/app/web/routes/public/public-competition/public-competition-results/public-competition-results.component"

export function calcCircles(marks: Array<Mark> | undefined,  checkpoints: Array<Checkpoint>): number {
    const orders = checkpoints.map((item) => item.order)
    if (orders.length == 1) {
        return marks.filter(item => orders.indexOf(item.order) >= 0 ).length + 1
    }
    let circles = 1

    if (marks) {
        let checkpointsOrders = checkpoints.map((item) => item.order)

        marks.forEach((item) => {
            const index = checkpointsOrders.indexOf(item.order)
            if (index < 0) {
                circles += 1
                checkpointsOrders = [...orders]
            } else if (index == 0) {
                checkpointsOrders.splice(index, 1)
            } else {
                circles += 1
            }
        })
        return circles + (checkpointsOrders.length == orders.length ? 0 : 1)
    } else {
        return 1
    }
}

export function filterPredicate (item: PublicTableAthletRow | PublicTableResultRow, filter: string): boolean {
    const data: {search: string, class: string} | null = JSON.parse(filter)
    let result = true

    if (!data) {
        result = true
    } else {
        const search = data.search.trim()

        if (search.length) {
            const clean_search = search.toLowerCase()

            if (parseInt(clean_search).toString() == clean_search) {
                result = item.number.toString().indexOf(clean_search) >= 0
            } else {
                result = item.fio.toLowerCase().indexOf(clean_search) >= 0
            }

        }

        if (data.class.length) {
            result = result && (item.class == data.class)
        }
    }
    return result
}
