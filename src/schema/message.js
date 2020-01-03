import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    messages(cursor: String, limit: Int): MessageConnection!
    message(id: ID!): Message!
  }
  extend type Mutation {
    createMessage(receiverId: ID!): Message!
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
    chatId: String!
    members: [Member!]
    text: String!
    createdAt: Date!
    user: User!
  }
  extend type Subscription {
    messageCreated: MessageCreated!
  }
  type MessageCreated {
    message: Message!
  }
  type Member {
    userId: String!
  }
`;
