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
    authFacebook(input: AuthInput!): AuthResponse
    authGoogle(input: AuthInput!): AuthResponse
    deleteUser(id: ID!): Boolean!
    uploadAvatar(imageUrl: String!): User
  }
  type Token {
    token: String!
    refreshToken: String!
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
    role: String
    messages: [Message!]
    bio: String
    rating: Int
    socials: [Social]
    avatar: String
    refreshToken: String!
    accessToken: String!
  }
  type Social {
    portfolio: String
    facebook: String
    instagram: String
    vimeo: String
  }
`;