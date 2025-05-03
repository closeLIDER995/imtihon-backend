const express = require('express');
const expressFileupload = require('express-fileupload');
const cors = require('cors');

const path = require('path');

const dotenv = require('dotenv');
dotenv.config()

const app = express();
const PORT = process.env.PORT || 4001;

// Routes use

app.use(express.json());
app.use(cors());
app.use(expressFileupload());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => { console.log(`server running on port: ${PORT}`) })