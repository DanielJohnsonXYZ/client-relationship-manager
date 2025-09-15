import { WebClient } from '@slack/web-api'

export interface SlackMessage {
  ts: string
  user: string
  text: string
  thread_ts?: string
  channel: string
}

export class SlackClient {
  private client: WebClient

  constructor(accessToken: string) {
    this.client = new WebClient(accessToken)
  }

  async getChannels() {
    try {
      const result = await this.client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
      })

      return result.channels || []
    } catch (error) {
      console.error('Error fetching Slack channels:', error)
      throw error
    }
  }

  async getChannelHistory(channelId: string, since?: Date): Promise<SlackMessage[]> {
    try {
      const oldest = since ? Math.floor(since.getTime() / 1000).toString() : undefined
      
      const result = await this.client.conversations.history({
        channel: channelId,
        oldest,
        limit: 100,
      })

      if (!result.messages) {
        return []
      }

      return result.messages.map(msg => ({
        ts: msg.ts!,
        user: msg.user!,
        text: msg.text || '',
        thread_ts: msg.thread_ts,
        channel: channelId,
      }))
    } catch (error) {
      console.error(`Error fetching channel history for ${channelId}:`, error)
      throw error
    }
  }

  async getUserInfo(userId: string) {
    try {
      const result = await this.client.users.info({
        user: userId,
      })

      return result.user
    } catch (error) {
      console.error(`Error fetching user info for ${userId}:`, error)
      return null
    }
  }

  async getDirectMessages(since?: Date) {
    try {
      const oldest = since ? Math.floor(since.getTime() / 1000).toString() : undefined
      
      // Get list of DM channels
      const dmChannels = await this.client.conversations.list({
        types: 'im',
        exclude_archived: true,
      })

      const messages: SlackMessage[] = []

      for (const channel of dmChannels.channels || []) {
        try {
          const history = await this.client.conversations.history({
            channel: channel.id!,
            oldest,
            limit: 50,
          })

          for (const msg of history.messages || []) {
            messages.push({
              ts: msg.ts!,
              user: msg.user!,
              text: msg.text || '',
              thread_ts: msg.thread_ts,
              channel: channel.id!,
            })
          }
        } catch (channelError) {
          console.warn(`Failed to fetch DM history for channel ${channel.id}:`, channelError)
        }
      }

      return messages
    } catch (error) {
      console.error('Error fetching direct messages:', error)
      throw error
    }
  }
}