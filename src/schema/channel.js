import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    channels(cursor: String, limit: Int): ChannelConnection!
    channel(channelId: Int!): Channel
    getUserChannels: [Channel]
  }
  extend type Mutation {
    createChannel(receiverId: Int, content: String): Channel!
  }
  type Channel {
    id: ID!
    receiverId: User!
    senderId: User!
    createdAt: Date!
    messages: [Message!]
    lastMessage: String
    lastMessageCreatedAt: Date
    lastMessageSender: Boolean
  }
  type ChannelConnection {
    edges: [Channel!]
    pageInfo: PageInfo!
  }

  extend type Subscription {
    channelCreated: Channel!
    channelUpdated: Channel
    getChannel(channelId: Int!): Channel
  }
`;
