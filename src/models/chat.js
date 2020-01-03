const chat = (sequelize, DataTypes) => {
  const Chat = sequelize.define("chat", {
    text: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          args: true,
          msg: "A Chat has to have a text."
        }
      }
    },
    chatName: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          args: true,
          msg: "A Chat has to have a chat name."
        }
      }
    },
    receiverId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          args: true,
          msg: "A chat must have a receiver id."
        }
      }
    },
    senderId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          args: true,
          msg: "A Chat must have a sender id."
        }
      }
    },
    members: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      // validate: {
      //   notEmpty: {
      //     args: true,
      //     msg: "Chat must have two members."
      //   }
      // },
      defaultValue: [1, 3]
    }
  });
  Chat.associate = models => {
    // Chat.belongsTo(models.User);
    Chat.belongsTo(models.User, {
      foreignKey: {
        name: "receiverId",
        field: "receiver_id"
      }
    });
    Chat.belongsTo(models.User, {
      foreignKey: {
        name: "senderId",
        field: "sender_id"
      }
    });
  };
  return Chat;
};
export default chat;
