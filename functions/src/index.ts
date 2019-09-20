import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

const cors = require('cors')
const request = require('request')
const querystring = require('querystring')


admin.initializeApp(functions.config().firebase);

const app = express();
const main = express();

main.use('/api/v1', app);

const whitelist = ['http://localhost:4200', 'https://rageorg.agestart.ru']

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next()
// })
app.use(cors({
    origin: (origin: string, callback: any) => {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200
}));
app.use(express.json());

export const smsApi = functions.https.onRequest(main)

app.post('/sms', (app_request, app_response) => {

    const params: string = querystring.stringify({
        mes: `${Math.random().toString().substring(2, 8)} - Код для регистрации участника`,
        phones: app_request.body.phone
    })
    request.get(`https://smsc.ru/sys/send.php?login=agestart&psw=siKiyas9&${params}`, (error: any, response: any, body: any) => {
        app_response.send(JSON.stringify({
            boby: body,
            error: error
        }))
    })
})
