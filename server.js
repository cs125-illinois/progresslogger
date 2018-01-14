#!/usr/bin/env node

require('dotenv').config()
const _ = require('lodash')

const express = require('express')
const bodyParser = require('body-parser')
const mongo = require('mongodb').MongoClient
const bunyan = require('bunyan')
const moment = require('moment')
const log = bunyan.createLogger({
  name: 'progresslogger',
  streams: [
    {
      type: 'rotating-file',
      path: 'logs/progresslogger-info.log',
      period: '1d',
      count: 365,
      level: 'info'
    },
    {
      type: 'rotating-file',
      path: 'logs/progresslogger-debug.log',
      period: '1d',
      count: 28,
      level: 'debug'
    }
  ]
})

const jsYAML = require('js-yaml')
const fs = require('fs')
const defaults = {
  port: 8181
}
const argv = require('minimist')(process.argv.slice(2))
let config = _.extend(
  defaults,
  jsYAML.safeLoad(fs.readFileSync('config.yaml', 'utf8')),
  argv
)
let PrettyStream = require('bunyan-prettystream')
let prettyStream = new PrettyStream()
prettyStream.pipe(process.stdout)
if (config.debug) {
  log.addStream({
    type: 'raw',
    stream: prettyStream,
    level: "debug"
  })
} else {
  log.addStream({
    type: 'raw',
    stream: prettyStream,
    level: "warn"
  })
}
log.debug(_.omit(config, 'secrets'))

let app = express()
app.use(bodyParser.json())

let progress
app.post('/', (request, response) => {
  request.body.received = moment().toDate()
  progress.insert(request.body).catch(err => {
    log.fatal(err)
  })
  log.info(request.body)
  response.status(200).send()
})

mongo.connect(process.env.MONGO)
  .then(client => {
    progress = client.db(config.db).collection('progress')
    app.listen(config.port)
  })

// vim: ts=2:sw=2:et:ft=javascript
