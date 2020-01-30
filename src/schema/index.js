import { gql } from "apollo-server-express";

import userSchema from "./user";
import messageSchema from "./message";
import postSchema from "./post";
import channelSchema from "./channel";
import textSchema from "./text";
import notificationSchema from "./notification";

const linkSchema = gql`
  scalar Date
  type Query {
    _: Boolean
  }
  type Mutation {
    _: Boolean
  }
  type Subscription {
    _: Boolean
  }
`;

export default [
  linkSchema,
  userSchema,
  messageSchema,
  postSchema,
  channelSchema,
  textSchema,
  notificationSchema
];
