import bcrypt from "bcrypt";

const user = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.STRING
    },
    homepage: {
      type: DataTypes.STRING
    },
    bio: {
      type: DataTypes.STRING
    },
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avatar: {
      type: DataTypes.STRING
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    lat: {
      type: DataTypes.FLOAT
    },
    lon: {
      type: DataTypes.FLOAT
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailConfirmToken: {
      type: DataTypes.STRING
    },
    linkedin: {
      type: DataTypes.STRING
    },
    youtube: {
      type: DataTypes.STRING
    },
    instagram: {
      type: DataTypes.STRING
    },
    facebook: {
      type: DataTypes.STRING
    },
    vimeo: {
      type: DataTypes.STRING
    },
    Portfolio: {
      type: DataTypes.JSON,
      defaultValue: {},
      validate: {
        isSpecificLength(value) {
          if (value.length >= 2) {
            throw new Error("Portfolio can only have 3 items");
          }
        }
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      validate: {
        notEmpty: {
          args: true,
          msg: "Post needs one ore more tag."
        }
      }
    },
    lastMessageCreatedAt: {
      type: DataTypes.DATE
    },
    lastMessageId: {
      type: DataTypes.INTEGER
    },
    lastMessage: {
      type: DataTypes.STRING
    },
    lastMessageSender: {
      type: DataTypes.BOOLEAN
    }
  });

  User.associate = models => {
    User.hasMany(models.Message, { onDelete: "CASCADE" });
    User.hasMany(models.Post, { onDelete: "CASCADE" });
    User.hasMany(models.Post, {
      onDelete: "CASCADE",
      foreignKey: {
        name: "favoritePosts",
        field: "favorite_posts"
      }
    });
  };

  User.findByLogin = async login => {
    let user = await User.findOne({
      where: { username: login }
    });

    if (!user) {
      user = await User.findOne({
        where: { email: login }
      });
    }
    return user;
  };

  User.beforeCreate(async user => {
    user.password = await user.generatePasswordHash();
  });

  User.prototype.generatePasswordHash = async function() {
    const saltRounds = 10;
    return await bcrypt.hash(this.password, saltRounds);
  };

  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};

export default user;
