import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    posts(cursor: String, limit: Int, offset: Int): PostConnection!
    queryPosts(
      cursor: String
      limit: Int
      offset: Int
      filter: String
    ): PostConnection!
    post(id: ID!): Post!
    searchPosts(query: String!): [FilteredPost!]
  }
  extend type Mutation {
    createPost(
      text: String!
      title: String!
      postImage: String!
      tags: [String!]
      category: [String!]
      location: String!
      lat: Float!
      lng: Float!
    ): Post!
    deletePost(id: ID!): Boolean!
  }
  type PostConnection {
    edges: [Post!]!
    pageInfo: PageInfo!
  }
  type FilteredPost {
    id: ID!
    title: String!
    text: String!
    category: [String]!
    tags: [String!]
    location: String!
    username: String!
    lastName: String!
    firstName: String!
    createdAt: Date!
    postImage: String!
  }
  type Post {
    id: ID!
    text: String!
    title: String!
    tags: [String!]
    createdAt: Date!
    user: User!
    category: [String!]
    postImage: String!
    location: String!
    lat: Float!
    lng: Float!
  }
  extend type Subscription {
    postCreated: PostCreated!
  }
  type PostCreated {
    post: Post!
  }
`;
