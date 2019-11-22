#!/bin/bash
#origin='http://localhost:4200'
origin='https://raceorg.agestart.ru'

#curl -H "Origin: ${origin}" \
# -H "Access-Control-Request-Method: POST" \
# -H "Access-Control-Request-Headers: X-Requested-With" \
# -X OPTIONS -I https://us-central1-race-org.cloudfunctions.net/v1/api/check_sms
#echo ''
#
#curl -H "Origin: ${origin}" \
# -H "Access-Control-Request-Method: POST" \
# -H "Access-Control-Request-Headers: X-Requested-With" \
# -H "Content-Type: application/json" \
# -X POST \
# -d '{"phone": 9603273301, "competitionId":"5ysLYGgsSJ9nSa3OK0kC", "code": 575744}' https://us-central1-race-org.cloudfunctions.net/v1/api/check_sms
#echo ''

curl -H "Origin: ${origin}" \
 -H "Access-Control-Request-Method: POST" \
 -H "Access-Control-Request-Headers: X-Requested-With" \
 -H "Content-Type: application/json" \
 -X POST \
 -d '{"secret": 123456, "user": "zc9kbuawmlPWm88viKSqcfMneg43"}' https://us-central1-race-org.cloudfunctions.net/v1/api/set_permissions_new
echo ''
