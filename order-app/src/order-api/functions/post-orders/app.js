// // // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// // // SPDX-License-Identifier: MIT-0

// // const dynamodb = require('aws-sdk/clients/dynamodb');
// // const docClient = new dynamodb.DocumentClient();
// // const uuid = require('node-uuid');

// // const tableName = process.env.ORDER_TABLE;
// // const DEFAULT_ORDER_STATUS = "PENDING" // Default Order Status will be written to DynamoDB

// // // The function returns current date
// // const getCurrentDate = () => {
// //     let date_ob = new Date();
// //     let date = ("0" + date_ob.getDate()).slice(-2);
// //     let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
// //     let year = date_ob.getFullYear();
// //     let hours = date_ob.getHours();
// //     let minutes = date_ob.getMinutes();
// //     let seconds = date_ob.getSeconds();
    
// //     return year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":" + seconds;
// // }

// // exports.postOrders = async (event) => {
// //     let formattedDateNow = getCurrentDate();
// //     const { body } = event;   // It destructures the body payload from event. 
// //     let parsedBody = JSON.parse(body); // It parses the JSON payload to java script object 
    
// //     // The item contains fully order Item. 
// //     let item = {
// //         user_id : "static_user",   
// //         id: uuid.v4(),             
// //         name: parsedBody.name, 
// //         restaurantId: parsedBody.restaurantId, 
// //         quantity: parsedBody.quantity,
// //         createdAt: formattedDateNow.toString(),
// //         orderStatus: DEFAULT_ORDER_STATUS,
// //     }
    
// //     let params = {
// //         TableName : tableName,
// //         Item: item
// //     }; 

// //     // We use 'put' operator to put item to Dynamodb.
// //     try {
// //         const data = await docClient.put(params).promise()
// //         console.log("Success for putting Item")
// //         console.log(data)
// //     } catch (err) {
// //         console.log("Failure", err.message)
// //     }
// //     const response = {
// //       statusCode: 200,
// //       body: JSON.stringify(item)

// //     };
// //     return response;
// // }


// // Now new code due to addition of sqs in lab 2


// // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// // SPDX-License-Identifier: MIT-0

// const dynamodb = require("aws-sdk/clients/dynamodb")
// const docClient = new dynamodb.DocumentClient()
// const uuid = require("node-uuid")

// const tableName = process.env.ORDER_TABLE
// const DEFAULT_ORDER_STATUS = "PENDING"

// // It gets the current date
// const getCurrentDate = () => {
//   let date_ob = new Date()
//   let date = ("0" + date_ob.getDate()).slice(-2)
//   let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
//   let year = date_ob.getFullYear()
//   let hours = date_ob.getHours()
//   let minutes = date_ob.getMinutes()
//   let seconds = date_ob.getSeconds()

//   return (
//     year +
//     "-" +
//     month +
//     "-" +
//     date +
//     "T" +
//     hours +
//     ":" +
//     minutes +
//     ":" +
//     seconds
//   )
// }

// exports.postOrders = async (event) => {
//   let formattedDateNow = getCurrentDate()

//   // We are reading the records from SQS in a loop
//   for (const record of event.Records) {
//     const { messageId, body } = record // Now destructures the MessageId and Body from event.
//     let parsedBody = JSON.parse(body) // Parses the Json to Javascript object

//     // Instead of ussing uuid in Id, now we are passing MessageId to Id parameter in Item payload
//     let item = {
//       user_id: "static_user",
//       id: messageId,
//       name: parsedBody.data.name,
//       restaurantId: parsedBody.data.restaurantId,
//       quantity: parsedBody.data.quantity,
//       createdAt: formattedDateNow.toString(),
//       orderStatus: DEFAULT_ORDER_STATUS,
//     }

//     let params = {
//       TableName: tableName,
//       Item: item,
//     }

//     // Use Put method to put items into Dynamodb
//     try {
//       const data = await docClient.put(params).promise()
//       console.log("Success for putting Item")
//       console.log(data)
//     } catch (err) {
//       console.log("Failure", err.message)
//     }
//   }
//   const response = {
//     statusCode: 200,
//   }
//   return response
// }



// lab 3 .. now adding step function config

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Instead of using DynamoDB client, we will be using Stepfunctions client
const stepfunctions = require('@aws-sdk/client-sfn');
const stepfunctionsClient = new stepfunctions.SFN();
const DEFAULT_ORDER_STATUS = "PENDING"

// Now, are getting State Machine Arn from environment variable
const stateMachineArn = process.env.STATE_MACHINE_ARN;

// Gets the current date
const getCurrentDate = () => {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    
    return year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":" + seconds;
}

exports.postOrders = async (event) => {
  let formattedDateNow = getCurrentDate();
  
  for(const record of event.Records){
    const {messageId, body} = record;
    let parsedBody = JSON.parse(body);    
    
    let item = {
      user_id : "static_user", 
      id: messageId, 
      name: parsedBody.data.name, 
      restaurantId: parsedBody.data.restaurantId, 
      createdAt: formattedDateNow.toString(),
      quantity: parsedBody.data.quantity,
      orderStatus: DEFAULT_ORDER_STATUS,
    }
    
    // We will be creating step functions object from input and stateMachine arn.
    const startReq = {
      stateMachineArn: stateMachineArn,
      input: JSON.stringify(item),
      name: messageId
     }
    
    // It calls the startExecution method of step functions client with input
    try {
      console.log('starting a SFN execution', { stateMachineArn: stateMachineArn })
      await stepfunctionsClient.startExecution(startReq);
      console.log('Job Completed')
    } catch (error) {
      console.log(error)
    }
  }

  const response = {
    statusCode: 200
  };
  return response;
}

