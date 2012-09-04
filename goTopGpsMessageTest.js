var goTopGpsMessage = require('./goTopGpsMessage');

var GPS_MESSAGE_FROM_ALARM = 'V,DATE:120903,TIME:160649,LAT:59.9326566N,LOT:010.7875033E,Speed:005.5,X-X-X-X-82-10,000,24202-0324-0E26';
var GPS_MESSAGE_FROM_CMD_T = 'V,DATE:120903,TIME:160649,LAT:59.9326566N,LOT:010.7875033E,Speed:005.5,X-X-X-X-49-5,000,24202-0ED9-D93B';
var GPS_MESSAGE_FROM_PROTOCOL_DOC = 'A,DATE:090329,TIME:223252,LAT:22.7634066N,LOT:114.3964783E,Speed:000.0,84-20,';

var message = goTopGpsMessage.parseMessage(GPS_MESSAGE_FROM_ALARM);
console.log(message);
message = goTopGpsMessage.parseMessage(GPS_MESSAGE_FROM_CMD_T);
console.log(message);
message = goTopGpsMessage.parseMessage(GPS_MESSAGE_FROM_PROTOCOL_DOC);
console.log(message);