import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    getUserNotifications: [Notification]
  }
  extend type Mutation {
    createNotification(receiverId: ID, content: String!): Notification!
    deleteNotification(id: ID!): Boolean!
    updateNotificationSeen(userId: ID!): Boolean
  }
  type Notification {
    id: ID!
    seen: Boolean!
    userId: User!
    messageId: Int
    postId: Int
    createdAt: Date!
  }
  extend type Subscription {
    notificationCreatedOrDeleted: Message!
  }
`;
