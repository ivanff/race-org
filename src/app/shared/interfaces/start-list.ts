import * as firebase from "firebase"

export interface StartListGroup {
    id: string,
    order: number,
    start_time: firebase.firestore.Timestamp
}
