import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import DocumentSnapshot = admin.firestore.DocumentSnapshot
import QuerySnapshot = admin.firestore.QuerySnapshot
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot

admin.initializeApp(
    functions.config().firebase
)

interface Secret {
    admin: number,
    marshal: number,
    client: number,
}

interface Competition {
    id?: string,
    parent_id?: string,
    user: string,
    secret?: Secret
    stages: Array<Competition>,
    [key: string]: any
}

const firestore = admin.firestore()

const app = express()
// const whitelist = ['http://localhost:4200', 'https://raceorg.agestart.ru']
const corsOptions = {
    // origin: (origin: string, callback: any) => {
    //     if (whitelist.indexOf(origin) !== -1) {
    //         callback(null, true)
    //     } else {
    //         callback(new Error('Not allowed by CORS'))
    //     }
    // },
    origin: ['http://localhost:4200', 'https://raceorg.agestart.ru'],
    methods: ['HEAD', 'POST'],
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

app.post('/api/check_sms', async (req, resp) => {
    await firestore.doc(`/sms_codes/${req.body.phone}_${req.body.competitionId}`).get().then((doc: DocumentSnapshot) => {
        if (doc.exists) {
            if (doc.data().code === req.body.code) {
                resp.status(200).json({})
            } else {
                resp.status(400).json({
                    message: "Проверочный код не совпадает"
                })
            }
        } else {
            resp.status(400).json({
                message: "Проверочный код не найден"
            })
        }
    })
})
app.post('/api/set_permissions_new', async (req, resp) => {
    if (!req.body.user || !req.body.secret) {
        resp.status(400).json({
            message: "Недостаточно данных"
        })
    }
    const secrets: QuerySnapshot = await firestore.collectionGroup("test_secret").where('code', '==', req.body.secret).get()

    if (!secrets.empty) {
        const secret: QueryDocumentSnapshot = secrets.docs[0]
        const competitionId = secret.ref.parent.parent.id

        const permission = {
            competitionId: competitionId,
            role: secret.id,
        }

        await firestore.doc(`/permissions/${req.body.user}`).set(permission).then(() => {
            resp.status(200).json(permission)
        }).catch(() => {
            resp.status(400).json({
                message: "Ошибка создания прав"
            })
        })
    } else {
        resp.status(400).json({
            message: "Соревнованине не надено"
        })
    }

})

app.post('/api/set_permissions', async (req, resp) => {
    const results: Array<QuerySnapshot> = await Promise.all([
        firestore.collection("/competitions/").where('secret.marshal', '==', req.body.secret).get(),
        firestore.collection("/competitions/").where('secret.admin', '==', req.body.secret).get()
    ])

    const non_empty_snapshots: Array<QuerySnapshot> = results.filter((snapshot: QuerySnapshot) => !snapshot.empty)
    if (non_empty_snapshots.length) {
        const docs: Array<QueryDocumentSnapshot> = non_empty_snapshots[0].docs
        const stages_snapshot: QuerySnapshot = await firestore.collection(`/competitions/${docs[0].id}/stages/`).get()
        const stages: Array<Competition> = stages_snapshot.docs.map((item: QueryDocumentSnapshot) => {
            return {id: item.id,...item.data()} as Competition
        })

        const competition = {id: docs[0].id, ...docs[0].data(), stages} as Competition
        const i = [competition.secret['admin'], competition.secret['marshal']].indexOf(req.body.secret)

        if (i !== undefined && req.body.user) {
            firestore.doc(`/permissions/${req.body.user}`).set({
                competitionId: competition.id,
                role: ['admin', 'marshal'][i],
            }).then(() => {
                resp.status(200).json({
                    competition: competition,
                    role: ['admin', 'marshal'][i]
                })
            }).catch()
        } else {
            // по идее такого не должно быть, так как изночально все соревнования ищутся для секретного кода
            resp.status(400).json({
                message: "Секретный код не совпадает"
            })
        }
    } else {
        resp.status(400).json({
            message: "Соревнованине не надено"
        })
    }
})

export const v1 = functions.https.onRequest(app)
