const message = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
    content: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          args: true,
          msg: "A channel has to have a text."
        }
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
  Message.associate = models => {
    Message.belongsTo(models.Channel);
    Message.belongsTo(models.User, {
      foreignKey: {
        name: "receiverId",
        field: "receiver_id"
      }
    });
    Message.belongsTo(models.User, {
      foreignKey: {
        name: "senderId",
        field: "sender_id"
      }
    });
  };
  return Message;
};
export default message;
