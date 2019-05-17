#!/usr/bin/env node

require('dotenv').config()
const _ = require('lodash')
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const jsYAML = require('js-yaml')
const config = _.extend(
  { port: 8181 },
  jsYAML.safeLoad(fs.readFileSync('config.yaml', 'utf8')),
  argv
)

const bunyan = require('bunyan')
const PrettyStream = require('bunyan-prettystream')
const prettyStream = new PrettyStream()
prettyStream.pipe(process.stdout)
const log = bunyan.createLogger({ name: 'progresslogger', streams: [] })

log.addStream({
  type: 'raw',
  stream: prettyStream,
  level: "info"
})
if (config.debug) {
  log.addStream({
    type: 'raw',
    stream: prettyStream,
    level: "debug"
  })
}

const express = require('express')
const bodyParser = require('body-parser')
const mongo = require('mongodb').MongoClient
const moment = require('moment-timezone')

const semesters = _.mapValues(config.semesters, semester => {
  return {
    start: moment.tz(new Date(semester.start), config.timezone),
    end: moment.tz(new Date(semester.end), config.timezone)
  }
})

function getCurrentSemester() {
  const now = moment()
  return _.findKey(semesters, ({ start, end }) => {
    return now.isBetween(start, end, null, '[]')
  })
}

log.info(_.omit(config, 'secrets'))
log.info(`Current semester: ${ getCurrentSemester() }`)

let app = express()
app.use(bodyParser.json())

let progress
app.post('/', (request, response) => {
  request.body.received = moment().toDate()
  let semester = getCurrentSemester()
  if (semester) {
    request.body.receivedSemester = semester
  }
  log.info(request.body)
  progress.insertOne(request.body).catch(err => {
    log.fatal(err)
  })
  response.status(200).send()
})

mongo.connect(process.env.MONGO, { useNewUrlParser: true })
  .then(client => {
    progress = client.db('cs125').collection('progress')
    app.listen(config.port)
  }).catch(err => {
    log.fatal(err)
    process.exit(-1)
  })

// vim: ts=2:sw=2:et:ft=javascript
