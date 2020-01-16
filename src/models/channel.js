const channel = (sequelize, DataTypes) => {
  const Channel = sequelize.define("channel", {
    members: {
      type: DataTypes.ARRAY(DataTypes.INTEGER)
    }
  });
  Channel.associate = models => {
    Channel.hasMany(models.Message, { onDelete: "CASCADE" });
  };
  return Channel;
};
export default channel;
