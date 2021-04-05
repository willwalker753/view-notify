require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const nodemailer = require('nodemailer')
const { NODE_ENV } = require('./config')
const { Pool } = require('pg');

const pool = new Pool({  
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DB,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
})

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.post('/email', async(req, res) => { 
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    })
    let mailOptions = {
        from: process.env.EMAIL,
        to: process.env.RECEIVER,
        subject: req.body.name+' received a view',
        text: req.body.name+' got viewed by some random person out there finally.',
    }
    transporter.sendMail(mailOptions, function(err, data){
        if(err) {
            console.log(err)
        } else {
            console.log('Email sent!')
        }
    })
    try {
        let options = {
            timeZone: 'America/Chicago',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          },
          formatter = new Intl.DateTimeFormat([], options);
        let date = formatter.format(new Date());
        let sql = 'INSERT INTO Portfolio(ts) VALUES($1) RETURNING *';
        let params = [ date ];
        await pool.query(sql, params);
    }
    catch(err) {
        console.log(err)
    }
    res.status(200).send();
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app