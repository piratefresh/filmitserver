import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    channels(cursor: String, limit: Int): ChannelConnection!
    channel: Channel
    getChannel(channelId: Int!): Channel!
  }
  extend type Mutation {
    createChannel(receiverId: Int, content: String): Channel!
  }
  type Channel {
    id: ID!
    members: [Int!]
    createdAt: Date!
    messages: [Message!]
  }

  type ChannelConnection {
    edges: [Channel!]
    pageInfo: PageInfo!
  }
  type ChannelUpdate {
    channel: Channel!
  }
  type ChannelCreated {
    channel: Channel!
  }

  extend type Subscription {
    channelCreated(memberId: Int): ChannelCreated!
    channelUpdated(memberId: Int): ChannelUpdate!
  }
`;
