const notification = (sequelize, DataTypes) => {
  const Notification = sequelize.define("notification", {
    seen: {
      type: DataTypes.BOOLEAN,
      validate: {
        notEmpty: {
          args: true,
          msg: "A channel has to have a text."
        }
      }
    }
  });
  Notification.associate = models => {
    Notification.belongsTo(models.User);
    Notification.belongsTo(models.Message);
    Notification.belongsTo(models.Post);
    Notification.belongsTo(models.Channel);
  };
  return Notification;
};
export default notification;
