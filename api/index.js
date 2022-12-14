const uuid = require('uuid');
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const welcome = (event, context, callback) => {
    const response = {
        statusCode: 200,
        //  Uncomment below to enable CORS requests
        //  headers: {
        //      "Access-Control-Allow-Origin": "*",
        //      "Access-Control-Allow-Headers": "*"
        //  }, 
        body: JSON.stringify('Contacts API functioning!'), 
    };
    callback(null, response);
};

const create = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const { name, phone, imageUrl, note, email } = requestBody;

    if (typeof name !== "string") {
        console.error('Validation Failed');
        callback(new Error('Couldn\'t create contact information because of name validation errors.'));
        return;
    } else if (typeof phone !== "number") {
        console.error('Validation Failed');
        callback(new Error('Couldn\'t create contact information because of phone validation errors.'));
        return;
    } else if (typeof email !== "string") {
        console.error('Validation Failed');
        callback(new Error('Couldn\'t create contact information because of email validation errors.'));
        return;
    }

    const timestamp = new Date().getTime();

    const contactInfo = {
        id: uuid.v1(),
        name,
        email,
        phone,
        note,
        imageUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    submitContact(contactInfo)
        .then(res => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Sucessfully created contact with number ${phone}`,
                    contact: res
                })
            });
        })
        .catch(err => {
            console.log(err);
            callback(null, {
                statusCode: 500,
                body: JSON.stringify({
                    message: `Unable to submit contact with email ${email}`
                })
            })
        });
};

const listAllContact = (event, context, callback) => {
    var params = {
        TableName: process.env.CONTACT_TABLE,
    };

    console.log("Scanning Contact table.");
    const onScan = (err, data) => {

        if (err) {
            console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Scan succeeded.");
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    contacts: data.Items
                })
            });
        }

    };

    dynamoDb.scan(params, onScan);
};

const getSingleContact = (event, context, callback) => {
    const params = {
        TableName: process.env.CONTACT_TABLE,
        Key: {
            id: event.pathParameters.id,
        },
    };

    dynamoDb.get(params).promise()
        .then(result => {
            const response = {
                statusCode: 200,
                body: result.Item ? JSON.stringify(result.Item) : null,
            };
            callback(null, response);
        })
        .catch(error => {
            console.error(error);
            callback(new Error('Couldn\'t fetch contact.'));
            return;
        });
};


const submitContact = (contact) => {
    console.log('creating contact');
    const contactInfo = {
        TableName: process.env.CONTACT_TABLE,
        Item: contact,
    };
    return dynamoDb.put(contactInfo).promise()
        .then(res => contact);
};

module.exports = { welcome, create, listAllContact, getSingleContact };
