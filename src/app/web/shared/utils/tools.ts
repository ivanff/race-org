import {ResultMark as Mark} from "@src/app/web/routes/results/results.component"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"

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
