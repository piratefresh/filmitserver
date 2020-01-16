import { gql } from "apollo-server-express";

export default gql`
  extend type Mutation {
    createText(members: [Int!]!, channelName: String!, text: String!): Channel!
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
