import { google, gmail_v1 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: gmail_v1.Schema$MessagePart
  internalDate: string
}

export class GmailClient {
  private gmail: gmail_v1.Gmail
  private oauth2Client: OAuth2Client

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  async getMessages(query?: string, maxResults = 100): Promise<GmailMessage[]> {
    try {
      // Build query for recent messages
      let searchQuery = query || ''
      
      // Add date filter for last 24 hours if no specific query
      if (!query) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateString = yesterday.toISOString().split('T')[0].replace(/-/g, '/')
        searchQuery = `after:${dateString}`
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults,
      })

      if (!response.data.messages) {
        return []
      }

      const messages: GmailMessage[] = []

      // Fetch full message details
      for (const messageRef of response.data.messages) {
        try {
          const messageResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: messageRef.id!,
          })

          const message = messageResponse.data
          if (message) {
            messages.push({
              id: message.id!,
              threadId: message.threadId!,
              snippet: message.snippet || '',
              payload: message.payload!,
              internalDate: message.internalDate!,
            })
          }
        } catch (messageError) {
          console.warn(`Failed to fetch message ${messageRef.id}:`, messageError)
        }
      }

      return messages
    } catch (error) {
      console.error('Error fetching Gmail messages:', error)
      throw error
    }
  }

  extractMessageText(payload: gmail_v1.Schema$MessagePart): string {
    let text = ''

    if (payload.body?.data) {
      // Decode base64url
      const decodedText = Buffer.from(payload.body.data, 'base64url').toString('utf-8')
      text += decodedText
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          text += this.extractMessageText(part)
        }
      }
    }

    return text
  }

  extractHeaders(payload: gmail_v1.Schema$MessagePart) {
    const headers: { [key: string]: string } = {}
    
    if (payload.headers) {
      for (const header of payload.headers) {
        if (header.name && header.value) {
          headers[header.name.toLowerCase()] = header.value
        }
      }
    }

    return headers
  }

  async getLabels() {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me',
      })

      return response.data.labels || []
    } catch (error) {
      console.error('Error fetching Gmail labels:', error)
      throw error
    }
  }
}