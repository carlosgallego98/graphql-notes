const graphql = require('graphql');
const { GraphQLObjectType,
        GraphQLString,
        GraphQLID,
        GraphQLList,
        GraphQLNonNull,
        GraphQLSchema} = graphql;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Note } = require("../models/index");

// Types
const NoteType = new GraphQLObjectType({
    name:"Note",
    fields: () => ({
        id: {type: GraphQLID},
        title: { type: GraphQLString },
        body: { type: GraphQLString },
        slug: { type: GraphQLString },
        userId: { type: GraphQLID },
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
        creator: {
            type: UserType,
            resolve(parent,args){
                return User.findOne({where: {id:parent.userId}});
            }
        }
    })
})

const CategoryType = new GraphQLObjectType({
    name:"Note",
    fields: () => ({
        id: {type: GraphQLID},
        name: { type: GraphQLString },
    })
});

const UserType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: {type: GraphQLID},
        name: { type: GraphQLString },
        username: { type: GraphQLString },
        password: { type: GraphQLString },
        notes:{
            type: new GraphQLList(NoteType),
            resolve(parent,args){
                return Note.findAll( { where: { userId : parent.id } } );
            }
        }
    })
})

const AuthType = new GraphQLObjectType({
    name: "Auth",
    fields: () => ({
        userId: { type: GraphQLID },
        token: { type: GraphQLString },
        expires: { type: GraphQLString },
    })
})

// Queries
const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        notes: {
            type: new GraphQLList(NoteType),
            resolve(parent,args,req){ 
                return User.findOne({where: {id:req.userId},include: "Notes"})
                .then(results=>{
                    return results.Notes;
                });
            }
        },
        user:{
            type: UserType,
            args: { id: { type: GraphQLID } },
            resolve(parent,args){
                return User.findOne({where:{id:args.id}});
            }
        },
        login: {
            type: AuthType,
            args: {username: {type: GraphQLString},password: {type: GraphQLString} },
            resolve(parent,args){
                return User.findOne({where: {username: args.username}})
                            .then(result =>{
                                if (result){
                                    let token = jwt.sign({
                                        userId: result.id,
                                        username: result.username
                                    },"HolaMundoSoyPro",{expiresIn: "1h"});

                                    return { 
                                        userId: result.id,
                                        token: token,
                                        expires: "1h"
                                    }
                                }else{
                                    throw new Error("Credenciales incorrectas"); 
                                }
                            })
            }
        }
    }
})

const RootMutation = new GraphQLObjectType({
    name: "RootMutation",
    fields: {
        registerUser: {
            type: UserType,
            args : {
                name: {type: new GraphQLNonNull(GraphQLString)},
                username: {type: new GraphQLNonNull(GraphQLString)},
                password: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parent,args){
                return bcrypt.hash(args.password,10).then(hashedPassword =>{
                    return User.create({ name: args.name, username: args.username, password: hashedPassword })
                })
            }
        },
        createNote: {
            type: NoteType,
            args: {
                title: {type: new GraphQLNonNull(GraphQLString)},
                body: {type: new GraphQLNonNull(GraphQLString)},
            },
            resolve(parent,args,req){
                let slug = args.title;
                return Note.create({
                    title: args.title,
                    body: args.body,
                    userId: req.userId,
                    slug: slug.replace(" ","-",).toLowerCase()
                })
            }
        }

    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
})