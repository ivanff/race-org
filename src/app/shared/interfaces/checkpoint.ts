export interface Checkpoint {
    id?: string
    title: string
    marshal: string,
    order: number,
    devices: Array<string>
    classes: Array<string>
}
