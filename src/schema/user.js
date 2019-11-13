import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }
  extend type Mutation {
    signUp(username: String!, email: String!, password: String!): Token!
    signIn(login: String!, password: String!): LoginResponse!
    signOut: Boolean
    authFacebook(input: AuthInput!): AuthResponse
    authGoogle(input: AuthInput!): LoginResponse!
    deleteUser(id: ID!): Boolean!
    uploadAvatar(imageUrl: String!): User
    revokeRefreshTokensForUser(userId: Int!): Boolean!
  }
  type Token {
    accessToken: String!
  }
  type LoginResponse {
    accessToken: String!
    user: User!
  }
  input AuthInput {
    accessToken: String!
  }
  type AuthResponse {
    token: String
    name: String
  }
  type User {
    id: ID!
    username: String!
    email: String!
    tokenVersion: String!
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
