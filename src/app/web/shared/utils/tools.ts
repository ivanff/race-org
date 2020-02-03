import {ResultMark as Mark} from "@src/app/web/routes/results/results.component"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"

export function calcCircles(marks: Array<Mark> | undefined,  checkpoints: Array<Checkpoint>): number {
    const orders = checkpoints.map((item) => item.order)
    let circles = 1

    if (marks) {

        let checkpointsOrders = checkpoints.map((item) => item.order)
        marks.forEach((item) => {
            const index = checkpointsOrders.indexOf(item.order)
            if (index < 0) {
                circles += 1
                checkpointsOrders = [...orders]
            } else {
                checkpointsOrders.splice(index, 1)
            }
        })
        return circles + (checkpointsOrders.length == orders.length ? 0 : 1)
    } else {
        return 1
    }
}
