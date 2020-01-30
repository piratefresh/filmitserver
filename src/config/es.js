import { Client } from "@elastic/elasticsearch";
require("dotenv").config();

const elasticUrl = process.env.ELASTIC_URL || "http://localhost:9200";
const esclient = new Client({ node: elasticUrl });
const index = "post";
const type = "post";

/**
 * @function checkIndices
 * @returns {void}
 * @description Check if index exists already
 */
async function checkIndices() {
  esclient.indices.exists({ index }, (err, res, status) => {
    if (res) {
      console.log("index already exists");
    } else {
      esclient.indices.create({ index }, (err, res, status) => {
        console.log(err, res, status);
      });
    }
  });
}

/**
 * @function createIndex
 * @returns {void}
 * @description Creates an index in ElasticSearch.
 */

async function createIndex(index) {
  try {
    await esclient.indices.create({ index });
    console.log(`Created index ${index}`);
  } catch (err) {
    console.error(`An error occurred while creating the index ${index}:`);
    console.error(err);
  }
}

/**
 * @function setPostMapping,
 * @returns {void}
 * @description Sets the post mapping to the database.
 */

async function setPostMapping() {
  try {
    const schema = {};

    await esclient.indices.putMapping({
      index,
      type,
      include_type_name: true,
      body: {
        properties: {
          uid: {
            type: "integer"
          },
          title: {
            type: "text"
          },
          text: {
            type: "text"
          },
          city: {
            type: "text"
          },
          category: {
            type: "text"
          },
          categorykeyword: {
            type: "keyword"
          },
          tags: {
            type: "text"
          },
          username: {
            type: "text"
          },
          firstName: {
            type: "text"
          },
          lastName: {
            type: "text"
          },
          postImage: {
            type: "text"
          },
          createdAt: {
            type: "date"
          },
          location: {
            type: "geo_point"
          }
        }
      }
    });

    console.log("Post mapping created successfully");
  } catch (err) {
    console.error("An error occurred while setting the Post mapping:");
    console.error(err);
  }
}

/**
 * @function checkConnection
 * @returns {Promise<Boolean>}
 * @description Checks if the client is connected to ElasticSearch
 */

function checkConnection() {
  return new Promise(async resolve => {
    console.log("Checking connection to ElasticSearch...");
    let isConnected = false;

    while (!isConnected) {
      try {
        await esclient.cluster.health({});
        console.log("Successfully connected to ElasticSearch");
        isConnected = true;

        // eslint-disable-next-line no-empty
      } catch (_) {
        console.error("elasticsearch cluster is down!");
      }
    }

    resolve(true);
  });
}

module.exports = {
  esclient,
  checkIndices,
  setPostMapping,
  checkConnection,
  createIndex,
  index,
  type
};
