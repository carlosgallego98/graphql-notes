const PORT = process.env.PORT;

const express = require('express');
const bodyParser = require('body-parser');
const {graphqlHTTP} = require('express-graphql');

const expressPlayground = require('graphql-playground-middleware-express').default
const sechema = require('./sechemas/schema')
const AuthMiddleware = require("./middleware/auth")
const app = express();
app.use(bodyParser.json());

app.use(AuthMiddleware)

app.use('/graphql', graphqlHTTP({
    schema: sechema,
}))

app.use('/playground', expressPlayground({ endpoint: '/graphql' }))

app.listen(PORT, () => {
    console.log(`Servidor de Express corriendo en: http://localhost:${PORT}/graphql`);
});