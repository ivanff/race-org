export interface CheckPoint {
    id?: string
    device?: string
    key: string
    name: string
    marshal: string
    point: Array<number>
    order: number
    kind: string
}
