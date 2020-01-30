import Sequelize from "sequelize";
import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";
import { AuthenticationError, UserInputError } from "apollo-server";
import cloudinary from "cloudinary";
import { authenticateGoogle } from "../passport";
import { sendRefreshToken } from "../sendRefreshToken";
import { v4 as uuid } from "uuid";

import { isAdmin } from "./authorization";
import { createAccessToken, createRefreshToken } from "../auth";
import { sendEmail } from "../sendEmail";

cloudinary.config({
  cloud_name: process.env.UNSPLASH_CLOUD_NAME,
  api_key: process.env.UNSPLASH_API_KEY,
  api_secret: process.env.UNSPLASH_API_SECRET
});

const toCursorHash = string => Buffer.from(string).toString("base64");

const fromCursorHash = string =>
  Buffer.from(string, "base64").toString("ascii");

export default {
  Query: {
    users: async (parent, args, { models }) => {
      return await models.User.findAll();
    },
    queryUsers: async (
      parent,
      { cursor, limit = 100, offset, filter },
      { models }
    ) => {
      const cursorOptions = cursor
        ? {
            where: {
              createdAt: {
                [Sequelize.Op.lt]: fromCursorHash(cursor)
              }
            }
          }
        : {};

      const users = await models.User.findAll({
        order: [["createdAt", "DESC"]],
        limit: limit + 1,
        offset: offset,
        ...cursorOptions
      });

      const hasNextPage = users.length > limit;
      const edges = hasNextPage ? users.slice(0, -1) : users;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: toCursorHash(edges[edges.length - 1].createdAt.toString())
        }
      };
    },
    user: async (parent, { id }, { models }) => {
      return await models.User.findByPk(id);
    },
    me: async (parent, args, { models, me, req }) => {
      const authorization = await req.headers["authorization"];
      if (!authorization) {
        return null;
      }
      try {
        const token = await authorization.split(" ")[1];
        const payload = await jwt.verify(token, process.env.ACCESS_SECRET);
        const user = await models.User.findByPk(payload.id, { raw: true });
        //Find unread messages
        const unreadMessages = await models.Message.findAll({
          where: {
            receiverId: me.id,
            isRead: false
          },
          order: [["createdAt", "DESC"]],
          raw: true
        });

        user.unreadMessages = unreadMessages;

        console.log(unreadMessages);
        return user;
      } catch (err) {
        console.log(err);
        return null;
      }
    }
  },

  Mutation: {
    signUp: async (
      parent,
      { username, email, password, firstName, lastName },
      { models, secret }
    ) => {
      const userExists = await models.User.findByLogin(email || username);
      if (userExists) {
        throw new AuthenticationError("User Already Exists");
      }
      // Generate a random string for user email confirmation
      const emailConfirmToken = uuid();

      const user = await models.User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        emailConfirmToken
      });

      await sendEmail(
        email,
        "Confirm Account",
        `<span>Please click this link <a href="http://localhost:3000/confirm-email/${user.email}/${emailConfirmToken}">Click Here</a><span>`
      );

      return {
        accessToken: createAccessToken(user)
      };
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret, req, res }
    ) => {
      const user = await models.User.findByLogin(login);
      const { id, username, email, role } = user;
      if (!user) {
        throw new UserInputError("No user found with this login credentials.");
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError("Invalid password.");
      }

      const refreshToken = await createRefreshToken(user);
      sendRefreshToken(res, refreshToken);
      const accessToken = await createAccessToken(user);
      return {
        accessToken,
        user
      };
    },

    authGoogle: async (_, { input: { accessToken } }, { models, req, res }) => {
      req.body = {
        ...req.body,
        access_token: accessToken
      };
      try {
        const { data, info } = await authenticateGoogle(req, res);
        const { profile } = await data;
        console.log(profile.emails[0].value);

        let user = await models.User.findByLogin(profile.emails[0].value);

        if (user) {
          const refreshToken = await createRefreshToken(user);
          sendRefreshToken(res, refreshToken);
          return {
            accessToken: createAccessToken(user),
            user
          };
        }
        nameArr = str.split(/(\s+)/);
        const firstName = nameArr[0];
        const lastName = nameArr[1];
        user = await models.User.create({
          username: profile.id,
          email: profile.emails[0].value,
          password: profile.id,
          firstName,
          lastName
        });

        const refreshToken = await createRefreshToken(user);
        await sendRefreshToken(res, refreshToken);
        const accessToken = await createAccessToken(user);
        return {
          accessToken,
          user
        };
      } catch (err) {
        return err;
      }
    },

    confirmEmail: async (_, { emailConfirmToken, email }, { models, me }) => {
      console.log(emailConfirmToken, email);
      if (!emailConfirmToken || !email) {
        console.log("error 1");
        throw new UserInputError("email token or email is not inputed");
      }
      let user = await models.User.findByLogin(email);
      if (!user) {
        console.log("error 2");
        throw new AuthenticationError("User Does not Exist");
      }
      if (user.emailConfirmToken !== emailConfirmToken || user.emailConfirmed) {
        console.log("error 3");
        throw new UserInputError("invalid token or email");
      }

      user = await models.User.update(
        {
          emailConfirmToken: "",
          confirmed: true
        },
        { where: { email }, returning: true }
      );

      user = await models.User.findByLogin(email);

      return {
        accessToken: createAccessToken(user),
        user: user
      };
    },

    signOut: async (_, args, { req, res }) => {
      sendRefreshToken(res, "");

      return true;
    },

    updateProfile: async (
      parent,
      {
        id,
        username,
        email,
        homepage,
        bio,
        avatar,
        firstName,
        lastName,
        city,
        lon,
        lat,
        facebook,
        vimeo,
        youtube,
        linkedin,
        instagram
      },
      { models },
      info
    ) => {
      try {
        await models.User.update(
          {
            username,
            email,
            homepage,
            bio,
            avatar,
            firstName,
            lastName,
            city,
            lon,
            lat,
            facebook,
            vimeo,
            youtube,
            linkedin,
            instagram
          },
          { where: { id, username }, returning: true }
        );
        const user = await models.User.findOne({ where: { id, username } });

        return user;
      } catch (err) {
        console.log(err);
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

    revokeRefreshTokensForUser: async (_, { userId }, { models }) => {
      const user = await models.User.findByPk(userId);
      user.increment("tokenVersion", { by: 1 });

      return true;
    },

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
    },
    posts: async (user, args, { models }) => {
      console.log(user);
      return await models.Post.findAll({
        where: {
          userId: user.id
        }
      });
    }
  }
};
