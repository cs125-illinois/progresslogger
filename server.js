#!/usr/bin/env node

require('dotenv').config()
const _ = require('lodash')
const debug = require('debug')('progresslogger')

const express = require('express')
const bodyParser = require('body-parser')
const mongo = require('mongodb').MongoClient
const bunyan = require('bunyan')
const log = bunyan.createLogger({
  name: 'progresslogger',
  streams: [
    {
      type: 'rotating-file',
      path: 'log/progresslogger.log',
      period: '1d',
      count: 365,
      level: 'info'
    }
  ]
})

const argv = require('minimist')(process.argv.slice(2))
const defaults = {
  port: 8181
}
let config = _.extend(_.clone(defaults), argv)
debug(config)

let app = express()
app.use(bodyParser.json())

let progress
app.post('/', (request, response) => {
  progress.insert(request.body)
  log.info(request.body)
  response.status(200).send()
})

let database
mongo.connect(process.env.MONGO)
  .then(client => {
    database = client.db('MPs')
    progress = database.collection('progress')
    app.listen(config.port)
  })

// vim: ts=2:sw=2:et:ft=javascript
