const graphql = require('graphql');
const { GraphQLObjectType,
        GraphQLString,
        GraphQLID,
        GraphQLList,
        GraphQLNonNull,
        GraphQLSchema
} = graphql;
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
                if(!req.authUser){
                    throw new Error("Autenticación necesaria")
                }
                return User.findOne({where: {id:req.userId},include: "Notes"})
                .then(results=>{
                    return results.Notes;
                });
            }
        },
        user:{
            type: UserType,
            args: { id: { type: GraphQLID } },
            resolve(parent,args,req){
                if(!req.authUser){
                    throw new Error("Autenticación necesaria")
                }
                if(args.id) return User.findOne({where:{id:args.id}});
                return User.findOne({where:{id:req.userId}});
            }
        },
        login: {
            type: AuthType,
            args: {username: {type: GraphQLString},password: {type: GraphQLString} },
            resolve(parent,args,req){
                console.log(args)
                return User.findOne({where: {username: args.username}}).then(user =>{
                                if (user){
                                    return bcrypt.compare(args.password,user.password).then( ( res ) => {
                                        console.log(res)
                                        if(res){
                                            let token = jwt.sign({
                                                userId: user.id,
                                                username: user.username,
                                            },"HolaMundoSoyPro",{expiresIn: "4h"});

                                            return {
                                                userId: user.id,
                                                token: token,
                                                created: new Date().toISOString(),
                                                expires: "4h"
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
                if(req.authUser){
                    throw new Error("Ya estás registrado")
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
                if(!req.authUser){
                    throw new Error("Antenticación Necesaria")
                }
                return Note.create({
                    title: args.title,
                    body: args.body,
                    userId: req.userId,
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
                if(!req.authUser){
                    throw new Error("Antenticación Necesaria")
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