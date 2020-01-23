import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    messages(cursor: String, limit: Int): MessageConnection!
    message(id: ID!): Message!
    getUnreadMessages: [Message]
  }
  extend type Mutation {
    createMessage(receiverId: ID, content: String!): Message!
    deleteMessage(id: ID!): Boolean!
  }
  type MessageConnection {
    edges: [Message!]!
    pageInfo: PageInfo!
  }
  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String!
  }
  type Message {
    id: ID!
    content: String!
    isRead: Boolean!
    channelId: Int!
    receiverId: User!
    senderId: User!
    createdAt: Date!
    user: User!
  }
  extend type Subscription {
    messageCreated(receiverId: Int): MessageCreated!
  }
  type MessageCreated {
    message: Message!
  }
`;
