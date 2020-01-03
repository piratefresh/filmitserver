import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    chats: ChatConnection!
    chat: Chat
  }
  extend type Mutation {
    createChat(members: [Int!]!, chatName: String!): Chat!
  }
  type Chat {
    id: ID!
    chatName: String!
    members: [User!]
    text: [Text!]
    createdAt: Date!
    receiverId: Int!
    senderId: Int!
  }

  type ChatConnection {
    edges: [Text!]!
    pageInfo: PageInfo!
  }
`;
