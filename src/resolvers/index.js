import { GraphQLDateTime } from "graphql-iso-date";

import userResolvers from "../resolvers/user";
import messageResolvers from "../resolvers/message";
import postResolvers from "../resolvers/post";
import chatResolvers from "../resolvers/chat";
import textResolvers from "../resolvers/text";

const customScalarResolver = {
  Date: GraphQLDateTime
};

export default [
  customScalarResolver,
  userResolvers,
  messageResolvers,
  postResolvers,
  chatResolvers,
  textResolvers
];
