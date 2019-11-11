import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";
import { AuthenticationError, UserInputError } from "apollo-server";
import cloudinary from "cloudinary";
import { authenticateGoogle } from "../passport";
import bcrypt from "bcrypt";

import { isAdmin } from "./authorization";

cloudinary.config({
  cloud_name: "da91pbpmj",
  api_key: "446621691525293",
  api_secret: "a676b67565c6767a6767d6767f676fe1"
});

const createAccessToken = async (user, secret, expiresIn) => {
  const { id, email, username, role } = user;
  return await jwt.sign({ id, email, username, role }, secret, {
    expiresIn
  });
};

const createRefreshToken = async (user, secret, expiresIn) => {
  const { id, count } = user;
  return await jwt.sign({ id, count }, secret, {
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
      const data = await models.User.findByPk(me.id);
      data.accessToken = me.accessToken;
      data.refreshToken = me.refreshToken;

      return await data;
    }
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password },
      { models, secret }
    ) => {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await models.User.create({
        username,
        email,
        password: hashedPassword
      });

      return {
        token: createAccessToken(user, secret, "30m"),
        refreshToken: createRefreshToken(user, secret, "15min")
      };
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

      return {
        token: createAccessToken(user, secret, "1min"),
        refreshToken: createRefreshToken(user, secret, "15min")
      };
    },

    authGoogle: async (_, { input: { accessToken } }, { req, res }) => {
      req.body = {
        ...req.body,
        access_token: accessToken
      };

      try {
        // data contains the accessToken, refreshToken and profile from passport
        const { data, info } = await authenticateGoogle(req, res);
        console.log(data);

        if (data) {
          const user = await User.upsertGoogleUser(data);

          console.log(data);

          if (user) {
            return {
              name: user.name,
              token: user.generateJWT()
            };
          }
        }

        if (info) {
          console.log(info);
          switch (info.code) {
            case "ETIMEDOUT":
              return new Error("Failed to reach Google: Try Again");
            default:
              return new Error("something went wrong");
          }
        }
        return Error("server error");
      } catch (error) {
        return error;
      }
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
