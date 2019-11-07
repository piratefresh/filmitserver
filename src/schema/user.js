import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }
  extend type Mutation {
    signUp(username: String!, email: String!, password: String!): Token!
    signIn(login: String!, password: String!): Token!
    deleteUser(id: ID!): Boolean!
    uploadAvatar(imageUrl: String!): User
  }
  type Token {
    token: String!
  }
  type User {
    id: ID!
    username: String!
    email: String!
    role: String
    messages: [Message!]
    bio: String
    rating: Int
    socials: [Social]
    avatar: String
  }
  type Social {
    portfolio: String
    facebook: String
    instagram: String
    vimeo: String
  }
`;
