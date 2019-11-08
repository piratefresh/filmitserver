import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";
import { AuthenticationError, UserInputError } from "apollo-server";
import cloudinary from "cloudinary";

import { isAdmin } from "./authorization";

cloudinary.config({
  cloud_name: "da91pbpmj",
  api_key: "446621691525293",
  api_secret: "a676b67565c6767a6767d6767f676fe1"
});

const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role } = user;
  return await jwt.sign({ id, email, username, role }, secret, {
    expiresIn
  });
};

export default {
  Query: {
    users: async (parent, args, { models }) => {
      return await models.User.findAll();
    },
    user: async (parent, { id }, { models }) => {
      return await models.User.findByPk(id);
    },
    me: async (parent, args, { models, me }) => {
      if (!me) {
        return null;
      }
      console.log(me);
      return await models.User.findByPk(me.id);
    }
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password },
      { models, secret }
    ) => {
      const user = await models.User.create({
        username,
        email,
        password
      });

      return { token: createToken(user, secret, "30m") };
    },

    signIn: async (parent, { login, password }, { models, secret }) => {
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError("No user found with this login credentials.");
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError("Invalid password.");
      }

      return { token: createToken(user, secret, "30m") };
    },

    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.User.destroy({
          where: { id }
        });
      }
    ),

    uploadAvatar: async (parent, { id, imageUrl }, { models }, info) => {
      console.log(`file: ${imageUrl} ID: ${id}`);
      const user = await models.User.update({
        where: { id }
      });

      user.avatar = await imageUrl;

      return await user;
    }
  },

  User: {
    messages: async (user, args, { models }) => {
      console.log(user);
      return await models.Message.findAll({
        where: {
          userId: user.id
        }
      });
    }
  }
};
