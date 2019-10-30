import {gql} from "apollo-server-express";

export default gql`
  extend type Query {
    posts(cursor: String, limit: Int): PostConnection!
    post(id: ID!): Message!
  }
  extend type Mutation {
    createPost(
      text: String!
      title: String!
      startDate: String
      endDate: String
      tags: [String]
      category: [String]
    ): Post!
    deletePost(id: ID!): Boolean!
  }
  type PostConnection {
    edges: [Post!]!
    pageInfo: PageInfo!
  }
  type Post {
    id: ID!
    text: String!
    title: String!
    startDate: String!
    endDate: String!
    tags: [String!]
    createdAt: Date!
    user: User!
    category: [String!]
  }
  extend type Subscription {
    postCreated: PostCreated!
  }
  type PostCreated {
    post: Post!
  }
`;
