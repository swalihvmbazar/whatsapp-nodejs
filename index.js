const express = require('express')
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const app = express()
const port = 3000

app.use(express.json());


const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'new_session' }), // This will persist the session data
});

let isClientReady = false;
let qrCodeData = null

client.once('ready', () => {
    isClientReady = true;
    console.log('Client is ready!');
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    qrcode.generate(qr, {small: true});
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected, reason:', reason);
    // Handle the reconnection logic here
    client.initialize();  // Reinitialize the client
});

client.initialize();

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/get-qrcode', (req, res) => {
    if (qrCodeData) {
        res.json({ qrCode: qrCodeData });
    } else {
        res.status(400).json({ status: 'error', message: 'QR Code not generated yet. Try again later.' });
    }
});

app.get('/check-connection', (req, res) => {
    if (isClientReady) {
        res.json({ status: 'success', message: 'WhatsApp client is connected and ready.' });
    } else {
        res.status(500).json({ status: 'error', message: 'WhatsApp client is not connected.' });
    }
});

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    console.log( number, message);
    // Validate request
    if (!number || !message) {
        return res.status(400).send({ status: 'error', message: 'Please provide a number and message.' });
    }

    // Format the number to match WhatsApp's international format
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

    try {
        // Send message
        await client.sendMessage(formattedNumber, message);
        res.status(200).send({ status: 'success', message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send({ status: 'error', message: 'Failed to send message.' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})