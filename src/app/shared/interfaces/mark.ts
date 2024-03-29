import * as firebase from "firebase"

export interface Mark {
    key?: string
    created: firebase.firestore.Timestamp
    order: number
    competition_id: string
}
