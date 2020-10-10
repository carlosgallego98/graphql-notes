const PORT = process.env.PORT;

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const schema = require('./sechemas/schema')
const AuthMiddleware = require("./middleware/auth");

const server = new ApolloServer({ 
    schema: schema,
    cors: true,
    context: ({ req }) => {
        const token = req.headers.authorization.split(" ")[1] || '';
        if(token){
            let userToken
            userToken = jwt.verify(token,"HolaMundoSoyPro");
        
            if(!userToken){
                req.authUser = false;
            }
        
            req.authUser = true;
            req.userId = userToken.userId
            return { userToken };
        }
        req.authUser = false;
        },
    });

const app = express();
server.applyMiddleware({ app});

app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
);