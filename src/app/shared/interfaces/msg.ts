export interface Msg {
    level: 'alert' | 'success' | 'warning'
    msg: string
    timeout?: number
}
