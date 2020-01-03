import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
    queryUsers(
      cursor: String
      limit: Int
      offset: Int
      filter: String
    ): UserConnection!
  }
  extend type Mutation {
    signUp(username: String!, email: String!, password: String!): Token!
    signIn(login: String!, password: String!): LoginResponse!
    signOut: Boolean
    authFacebook(input: AuthInput!): AuthResponse
    authGoogle(input: AuthInput!): LoginResponse!
    deleteUser(id: ID!): Boolean!
    confirmEmail(email: String!, emailConfirmToken: String!): LoginResponse!
    updateProfile(
      id: ID!
      username: String!
      email: String!
      homepage: String
      bio: String
      avatar: String
      firstName: String
      lastName: String
      location: String
      facebook: String
      instagram: String
      youtube: String
      linkedin: String
      vimeo: String
    ): User
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
    firstName: String
    lastName: String
    email: String!
    tokenVersion: String!
    role: String
    messages: [Message!]
    posts: [Post!]
    bio: String
    homepage: String
    rating: Int
    socials: [Social]
    avatar: String
    location: String
    lat: Float
    lng: Float
    portfolio: String
    facebook: String
    instagram: String
    youtube: String
    vimeo: String
    linkedin: String
  }
  type UserConnection {
    edges: [User!]!
    pageInfo: PageInfo!
  }
  type Social {
    portfolio: String
    facebook: String
    instagram: String
    youtube: String
    vimeo: String
  }
`;
