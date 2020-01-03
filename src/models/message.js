const message = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
    members: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      validate: {
        notEmpty: {
          args: true,
          msg: "A message has to have a text."
        }
      }
    },
    chatId: {
      type: DataTypes.STRING
    }
  });
  Message.associate = models => {
    Message.belongsTo(models.User);
    Message.belongsTo(models.Text);
  };
  return Message;
};
export default message;
