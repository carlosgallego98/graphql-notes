const graphql = require('graphql');
const { GraphQLObjectType,
        GraphQLString,
        GraphQLID,
        GraphQLList,
        GraphQLNonNull,
        GraphQLSchema
} = graphql;
const {
    GraphQLDate,
    GraphQLTime,
    GraphQLDateTime
} = require('graphql-iso-date');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Note } = require("../models/index");
const slugify = require('slugify');

// Types
const NoteType = new GraphQLObjectType({
    name:"Note",
    fields: () => ({
        id: {type: GraphQLID},
        title: { type: GraphQLString },
        body: { type: GraphQLString },
        slug: { type: GraphQLString },
        userId: { type: GraphQLID },
        createdAt: { type: GraphQLDateTime },
        updatedAt: { type: GraphQLDateTime },
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
        createdAt: { type: GraphQLDateTime },
        updatedAt: { type: GraphQLDateTime },
        notes:{
            type: GraphQLList(NoteType),
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
            type: GraphQLList(NoteType),
            resolve(parent,args,req){
                if(!req.userToken.userId){
                    throw new Error("Autenticación necesaria")
                }
                return User.findOne({where: {id:req.userToken.userId},include: "Notes"})
                .then(results=>{
                    return results.Notes;
                });
            }
        },
        user:{
            type: UserType,
            resolve(parent,args,req){
                if(!req.userToken.userId){
                    throw new Error("Autenticación necesaria")
                }
                return User.findOne({where:{id:req.userToken.userId}});
            }
        },
        login: {
            type: AuthType,
            args: {username: {type: GraphQLString},password: {type: GraphQLString} },
            resolve(parent,args,req){
                return User.findOne({where: {username: args.username}}).then(user =>{
                                if (user){
                                    return bcrypt.compare(args.password,user.password).then( ( res ) => {
                                        console.log(res)
                                        if(res){
                                            let token = jwt.sign({
                                                userId: user.id,
                                                username: user.username,
                                            },"HolaMundoSoyPro");

                                            return {
                                                userId: user.id,
                                                token: token,
                                                created: new Date().toISOString(),
                                            }
                                        }else{
                                            throw new Error("Credenciales incorrectas");
                                        }
                                    })
                                }else{
                                    throw new Error("Credenciales incorrectas");
                                }
                            })
            }
        },
    }
})

const RootMutation = new GraphQLObjectType({
    name: "RootMutation",
    fields: {
        registerUser: {
            type: UserType,
            args : {
                name: {type: GraphQLNonNull(GraphQLString)},
                username: {type: GraphQLNonNull(GraphQLString)},
                password: {type: GraphQLNonNull(GraphQLString)}
            },
            resolve(parent,args,req){
                if(!req.userToken.userId){
                    throw new Error("Ya estas registrado")
                }
                return bcrypt.hash(args.password,10).then(hashedPassword =>{
                    return User.create({ name: args.name, username: args.username, password: hashedPassword })
                })
            }
        },
        createNote: {
            type: NoteType,
            args: {
                title: {type: GraphQLNonNull(GraphQLString)},
                body: {type: GraphQLNonNull(GraphQLString)},
            },
            resolve(parent,args,req){
                if(!req.userToken.userId){
                    throw new Error("Autenticación necesaria")
                }
                return Note.create({
                    title: args.title,
                    body: args.body,
                    userId: req.userToken.userId,
                    slug: slugify(args.title).toLowerCase()
                })
            }
        },
        deleteNote: {
            type: GraphQLString,
            args: {
                noteId: {type: new GraphQLNonNull(GraphQLID)},
            },
            resolve(parent,args,req){
                if(!req.userToken.userId){
                    throw new Error("Autenticación necesaria")
                }
                Note.destroy({
                    where:{id:args.noteId}
                });
                return "Nota eliminada satisfactoriamente";
            }
        }

    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
})