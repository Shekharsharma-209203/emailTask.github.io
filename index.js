require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');

const  { PDFDocument, StandardFonts } = require('pdf-lib');
const axios = require('axios');
const { Console } = require('console');


const app = express();

app.use(express.json());

app.get('/api/hello', (req, res) => {
    res.send('Hello, World!');
});


app.post('/api/policyAccept', async (req, res) => {
    const { id, transactionId, timestamp, data, type, username } = req.body;

    const policyNumber = data["policyLocator"];     // policyLocator  

    // Creating Authorization token

    const response_auth = await fetch('https://api.sandbox.socotra.com/account/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: process.env.tenant_username,
            password: process.env.tenant_pass,
            hostName: process.env.tenant_host,
        }),
    });

    const js_obj_auth = await response_auth.json();
    const string_json_auth = JSON.stringify(js_obj_auth);
    const parse_json_auth = JSON.parse(string_json_auth);

    const auth_token = parse_json_auth.authorizationToken;

    //console.log(parse_json_auth);


    // Fetching policy from policyLocator

    const response_policy = await fetch("https://api.sandbox.socotra.com/policy/" + policyNumber, {
        method: 'GET',
        headers: {
            "Authorization": auth_token,
            "Content-type": "application/json; charset=UTF-8"
        },

    })

    const js_obj_policy = await response_policy.json();
    const string_json_policy = JSON.stringify(js_obj_policy);
    const parse_json_policy = JSON.parse(string_json_policy);


    const recipientEmail = parse_json_policy.characteristics[0].fieldValues.email_field_example;

    const doc = parse_json_policy.documents[0].url;
    const documentType = parse_json_policy.documents[0].displayName;
    //const invoiceNAme = parse_json_policy.invoices[0].documents[0].displayName;
    //const invoice_doc = parse_json_policy.invoices[0].documents[0].url;


    async function convertURLToPDF(doc) {
        try {
            const response = await axios.get(doc, {
                responseType: 'arraybuffer',
            });

            const pdfDoc = await PDFDocument.create();
            const pdfBytes = response.data;

            const externalPdf = await PDFDocument.load(pdfBytes);
            const externalPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
            externalPages.forEach((page) => pdfDoc.addPage(page));



            const pdfBytesWithAttachments = await pdfDoc.save({ useObjectStreams: false });
            return pdfBytesWithAttachments;
        } catch (error) {
            console.error('Error converting URL to PDF:', error);
            throw error;
        }
    }

    async function sendEmailWithAttachment(attach, recipientEmail) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.sender_email_address,
                    pass: process.env.sender_password,
                },
            });

            let subject = '';
            if (documentType === 'Quotation Schedule') {
                subject = 'Quotation Document';
            } else if (documentType === 'New Business Schedule') {
                subject = 'Policy Document';
            } else if (documentType === 'Policy Change') {
                subject = 'Endorsement Document';
            } else {
                subject = 'Attachment';
            }


            const mailOptions = {
                from: process.env.sender_email_address,
                to: recipientEmail,
                subject: subject,
                text: 'Please find the attached documents.',
                attachments: attach
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    convertURLToPDF(doc)
        .then((pdfBytes1) => {

            //convertURLToPDF(invoice_doc)
            //    .then((pdfBytes2) => {
                    const attachments = [
                        {
                            filename: 'Quotation.pdf',
                            content: pdfBytes1,
                        }/*,
                        {
                            filename: 'Invoice.pdf',
                            content: pdfBytes2,
                        },*/
                    ];
                    sendEmailWithAttachment(attachments, recipientEmail);
            //    })
            //    .catch((error) => {
            //        console.log("Error on Sending Mail", error);
            //    });
        })
        .catch((error) => {
            console.log("Error on Sending Mail", error);
            // Handle any errors that occurred during the conversion
        });

    res.status(200).json({ message: 'Request received successfully' });

});

// endpoint for sending documents on policy issue

app.post('/api/policyIssue', async (req, res) => {
    const { id, transactionId, timestamp, data, type, username } = req.body;

    const policyNumber = data["policyLocator"];     // policyLocator  

    // Creating Authorization token

    const response_auth = await fetch('https://api.sandbox.socotra.com/account/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: process.env.tenant_username,
            password: process.env.tenant_pass,
            hostName: process.env.tenant_host,
        }),
    });

    const js_obj_auth = await response_auth.json();
    const string_json_auth = JSON.stringify(js_obj_auth);
    const parse_json_auth = JSON.parse(string_json_auth);

    const auth_token = parse_json_auth.authorizationToken;



    // Fetching policy from policyLocator

    const response_policy = await fetch("https://api.sandbox.socotra.com/policy/" + policyNumber, {
        method: 'GET',
        headers: {
            "Authorization": auth_token,
            "Content-type": "application/json; charset=UTF-8"
        },

    })

    const js_obj_policy = await response_policy.json();
    const string_json_policy = JSON.stringify(js_obj_policy);
    const parse_json_policy = JSON.parse(string_json_policy);


    const recipientEmail = parse_json_policy.characteristics[0].fieldValues.email_field_example;

    const doc = parse_json_policy.documents[1].url;

    const documentType = parse_json_policy.documents[1].displayName;

    //const invoice_doc = parse_json_policy.invoices[0].documents[0].url;



    async function convertURLToPDF(doc) {
        try {
            const response = await axios.get(doc, {
                responseType: 'arraybuffer',
            });

            const pdfDoc = await PDFDocument.create();
            const pdfBytes = response.data;

            const externalPdf = await PDFDocument.load(pdfBytes);
            const externalPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
            externalPages.forEach((page) => pdfDoc.addPage(page));



            const pdfBytesWithAttachments = await pdfDoc.save({ useObjectStreams: false });
            return pdfBytesWithAttachments;
        } catch (error) {
            console.error('Error converting URL to PDF:', error);
            throw error;
        }
    }

    async function sendEmailWithAttachment(attach, recipientEmail) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.sender_email_address,
                    pass: process.env.sender_password,
                },
            });

            let subject = '';
            if (documentType === 'Policy Schedule') {
                subject = 'Quotation Document';
            } else if (documentType === 'New Business Schedule') {
                subject = 'Policy Document';
            } else if (documentType === 'Policy Change') {
                subject = 'Endorsement Document';
            } else {
                subject = 'Attachment';
            }


            const mailOptions = {
                from: process.env.sender_email_address,
                to: recipientEmail,
                subject: subject,
                text: 'Please find the attached documents.',
                attachments: attach
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    convertURLToPDF(doc)
        .then((pdfBytes1) => {

            //convertURLToPDF(invoice_doc)
            //    .then((pdfBytes2) => {
                    const attachments = [
                        {
                            filename: 'Policy Document.pdf',
                            content: pdfBytes1,
                        }/*,
                        {
                            filename: 'Invoice.pdf',
                            content: pdfBytes2,
                        }*/
                    ];
                    sendEmailWithAttachment(attachments, recipientEmail);
            //    })
            //    .catch((error) => {
            //        console.log("Error on Sending Mail", error);
            //    });
        })
        .catch((error) => {
            console.log("Error on Sending Mail", error);
            // Handle any errors that occurred during the conversion
        });

    res.status(200).json({ message: 'Request received successfully' });
});



//endpoint for sending endorsement document when endorsement.issue event is triggered.

app.post('/api/endorsementIssue', async (req, res) => {
    const { id, transactionId, timestamp, data, type, username } = req.body;

    const policyNumber = data["policyLocator"];     // policyLocator  

    const locator = data["endorsementLocator"];

    // Creating Authorization token

    const response_auth = await fetch('https://api.sandbox.socotra.com/account/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: process.env.tenant_username,
            password: process.env.tenant_pass,
            hostName: process.env.tenant_host,
        }),
    });

    const js_obj_auth = await response_auth.json();
    const string_json_auth = JSON.stringify(js_obj_auth);
    const parse_json_auth = JSON.parse(string_json_auth);

    const auth_token = parse_json_auth.authorizationToken;


    // Fetching policy from policyLocator

    const response_policy = await fetch("https://api.sandbox.socotra.com/policy/" + policyNumber, {
        method: 'GET',
        headers: {
            "Authorization": auth_token,
            "Content-type": "application/json; charset=UTF-8"
        },

    })

    const js_obj_policy = await response_policy.json();
    const string_json_policy = JSON.stringify(js_obj_policy);
    const parse_json_policy = JSON.parse(string_json_policy);

    const recipientEmail = parse_json_policy.characteristics[0].fieldValues.email_field_example;




    // Fetching policy from Locator for endosement


    const response_Locator = await fetch("https://api.sandbox.socotra.com/endorsements/" + locator, {
        method: 'GET',
        headers: {
            "Authorization": auth_token,
            "Content-type": "application/json; charset=UTF-8"
        },

    })

    const js_obj_Locator = await response_Locator.json();
    const string_json_Locator = JSON.stringify(js_obj_Locator);
    const parse_json_Locator = JSON.parse(string_json_Locator);

    const doc = parse_json_Locator.documents[0].url;

    const documentType = parse_json_Locator.documents[0].displayName;

    //const invoice_doc = parse_json_Locator.invoice.documents[0].url;



    async function convertURLToPDF(doc) {
        try {
            const response = await axios.get(doc, {
                responseType: 'arraybuffer',
            });

            const pdfDoc = await PDFDocument.create();
            const pdfBytes = response.data;

            const externalPdf = await PDFDocument.load(pdfBytes);
            const externalPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
            externalPages.forEach((page) => pdfDoc.addPage(page));



            const pdfBytesWithAttachments = await pdfDoc.save({ useObjectStreams: false });
            return pdfBytesWithAttachments;
        } catch (error) {
            console.error('Error converting URL to PDF:', error);
            throw error;
        }
    }

    async function sendEmailWithAttachment(attach, recipientEmail) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: process.env.sender_email_address,
                    pass: process.env.sender_password,
                },
            });



            const mailOptions = {
                from: process.env.sender_email_address,
                to: recipientEmail,
                subject: documentType + ' Document',
                text: 'Please find the attached documents.',
                attachments: attach
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    convertURLToPDF(doc)
        .then((pdfBytes1) => {

            //convertURLToPDF(invoice_doc)
            //    .then((pdfBytes2) => {
                    const attachments = [
                        {
                            filename: 'Endorsement.pdf',
                            content: pdfBytes1,
                        }/*,
                        {
                            filename: 'Invoice.pdf',
                            content: pdfBytes2,
                        }*/

                    ];
                    sendEmailWithAttachment(attachments, recipientEmail);
            //    })
            //    .catch((error) => {
            //        console.log("Error on Sending Mail", error);
            //    });
        })
        .catch((error) => {
            console.log("Error on Sending Mail", error);
            // Handle any errors that occurred during the conversion
        });

    res.status(200).json({ message: 'Request received successfully' });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
