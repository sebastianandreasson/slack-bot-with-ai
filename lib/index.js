require('dotenv').config()
const express = require('express')
const axios = require('axios')

const { Configuration, OpenAIApi } = require('openai')
const { WebClient } = require('@slack/web-api')
const clientId = process.env.SLACK_CLIENT_ID
const clientSecret = process.env.SLACK_CLIENT_SECRET
const redirectUri = process.env.SLACK_REDIRECT_URL

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const app = express()
const port = process.env.PORT || 3000

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code
  try {
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        },
      }
    )

    if (response.data && response.data.access_token) {
      console.log('Access Token:', response.data.access_token)
      res.send('Access token obtained. Check the console for the token.')
    } else {
      res.status(400).send('Error obtaining access token.')
    }
  } catch (error) {
    console.error('Error exchanging code for access token:', error)
    res.status(500).send('Error obtaining access token.')
  }
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})

const web = new WebClient(process.env.SLACK_TOKEN)

const userMap = {
  ULMQEU5DW: 'Mattias',
  U04SRTALP5Y: 'Swen',
  U0113HTAVD5: 'Sebastian',
  U046DT49CN8: 'Hugo',
  UP0EKK14H: 'Vasiliki',
  ULMR1JP0D: 'Alexandra',
}

async function fetchMessages(channelId) {
  try {
    // Call the conversations.history method using the WebClient
    const messages = await web.conversations.history({
      channel: channelId,
      limit: 20,
    })
    // a message looks like this
    /*
    {
        client_msg_id: '3A7EB95A-E225-426F-A505-7314B642CEC2',
        type: 'message',
        text: 'Ok! Not attending over zoom?',
        user: 'ULMR1JP0D',
        ts: '1680593527.515319',
        blocks: [ [Object] ],
        team: 'TLFEK987K'
    }
    */

    // take messages from today
    const today = new Date()
    let todayMessages = messages.messages.filter((message) => {
      const messageDate = new Date(message.ts * 1000)
      return messageDate.getDate() === today.getDate()
    })
    // filter out users not matching our user map
    todayMessages = todayMessages.filter((message) => {
      return Object.keys(userMap).includes(message.user)
    })

    // sort messages by time from oldest to newest
    todayMessages.sort((a, b) => {
      return a.ts - b.ts
    })

    // format messages in a string like this
    /*
    [timestamp] [username]: [message]
    */

    const formattedMessages = todayMessages.map((message) => {
      const messageDate = new Date(message.ts * 1000)
      const messageDateString = messageDate
        .toLocaleTimeString('en-US', {
          hour12: false,
        })
        .slice(0, 5)
      return `[${messageDateString}] ${userMap[message.user]}: ${message.text}`
    })

    return formattedMessages.join('\n')

    // Check if there are messages
  } catch (error) {
    console.error('Error fetching messages:', error)
  }
}

const run = async () => {
  const checkInPrompt = await fetchMessages('CVBQCA3V5')

  const systemPrompt = `You are an AI assistant helping people who enter this office figure out where the people working here are.
The people working in this Office are: Mattias, Swen, Sebastian, Hugo, Vasiliki, Alexandra.

This morning the people working today checked in online on Slack with what they are doing:
${checkInPrompt}

The following is a log of when people entered the office building today:
[09:10] Vasiliki entered the office.
[09:15] Hugo entered the office.
[12:00] Hugo left the office.
[13:00] Hugo entered the office.
End of log.
  `

  const timestamp = new Date()
    .toLocaleTimeString('en-US', {
      hour12: false,
    })
    .slice(0, 5)
  const userPrompt = `[${timestamp}] Hi, I'm looking for Hugo.`

  console.log(systemPrompt)
  console.log(userPrompt)

  const response = await openai.createChatCompletion({
    frequency_penalty: 0,
    max_tokens: 1024,
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    presence_penalty: 0,
    stream: false,
    temperature: 0.5,
    top_p: 1,
  })

  console.log(response.data.choices[0].message.content)
}

run()
