// const AWS = require('aws-sdk');

// const ses = new AWS.SES({ apiVersion: '2010-12-01' }, {
// });

// const params = {
//     Destination: {
//         ToAddresses: ['shazzgit@gmail.com']
//     },
//     Message: {
//         Body: {
//             Text: { Data: 'Hello from Amazon SES!' }
//         },
//         Subject: { Data: 'Test Email' }
//     },
//     Source: 'thanosgaming121@gmail.com'
// };

// export const sendEmail = async () => {
//     let response = await ses.sendEmail(params, function (err, data) {
//         if (err) console.log(err, err.stack);
//         else console.log(data);
//     });
//     return response
// }


import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

