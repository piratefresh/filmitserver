import { gql } from "apollo-server-express";

export default gql`
  extend type Mutation {
    createText(members: [Int!]!, chatName: String!, text: String!): Chat!
  }

  type Text {
    id: ID!
    authorId: String!
    content: String!
    messageConversationId: String
    createdAt: Date
    updatedAt: Date
  }
`;
