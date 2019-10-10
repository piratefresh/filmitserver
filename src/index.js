import cors from 'cors';
import express from 'express'
import {ApolloServer, gql} from 'apollo-server-express'

const app = express();
app.use(cors());

const schema = gql`
    type Query {
        me: User
        user(id: ID!): User
        users: [User!]
    }

    type User {
        id: ID!
        username: String!
    }
`

let users = {
    1: {
      id: '1',
      username: 'Robin Wieruch',
    },
    2: {
      id: '2',
      username: 'Dave Davids',
    },
  };

const resolvers = {
    Query: {
        me: (parent, args, { me }) => {
            return me;
        },
        user: (parent, {id}) => {
            return users[id];
          },
        users: () => {
        return Object.values(users);
        },
    },
    User: {
        username: user => `${user.firstname} ${user.lastname}`,
    },
}

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: {
        me: users[1],
    },
})

server.applyMiddleware({ app, path: '/graphql' });

const port = 8000;
app.listen({port}, () => {
    console.log(`Server 📦 is running 🏃 at port  http://localhost:${port}/graphql`)
})
