const PORT = process.env.PORT || 3000;

const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
app.use(bodyParser.json());

var notes = [];

const schema = buildSchema(`
    type Category{
        name: String!
    }

    type Note{
        title: String!
        body: String!
        category: Category!
    }

    type Queries{
        notes: [Note!]!
    }

    type Mutations{
        addNote(title: String!,body: String!): [Note]
    }

    schema {
        query: Queries
        mutation: Mutations
    }
`);

const resolvers = {
    notes: () =>{
        return notes;
    },
    addNote: (args) =>{
        notes.push(
            {
                title:args.title,
                body:args.body,
            }
            );
        return notes;
    }
}

app.use('/graphql',graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true
}))  

app.listen(PORT,()=>{
    console.log(`Servidor de Express corriendo en: http://localhost:${PORT}/graphql`);
})
