const bcrypt = require("bcrypt");
const crs = require("crypto-random-string")
const moment = require("moment");
const UserSchema = require("../models/user.model");
const AuthSchema = require("../models/auth.model");
const RolesSchema = require("../models/roles.model");

const handleCreateUser = (req, res) => {

  // Check if body is non - empty
  if (Object.keys(req.body).length === 0 && req.body.constructor === Object) {
    res.status(400).send({ status: 'client-error', msg: 'The request did not contain the necessary parameters' })
  }

  // If body is non-empty, continue
  else {
    // Create required params for user and auth models
    const id = crs({ length: 25, type: 'url-safe' });
    const { username, password, email } = req.body;
    const codeIds = [];
    const registered = moment();
    const lastLogin = moment();

    // Create params for authentication
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    const role = RolesSchema;

    // Check if a user exists before saving
    AuthSchema.findOne({ username }, (err, doc) => {
      if (err) { res.status(500).send({ status: 'server-error', msg: 'Could not connect to database', err }) } 
      else if (doc && doc.username === username) { res.status(400).send({ status: 'client-error', msg: `The username ${username} already exists, please choose another`, err })}
      // If user doesn't exists, create a new one and save it to database
      else {
        role.find({ name: 'guest' }, (err, doc) => {
          if (err) { res.status(500).send({ status: 'server-error', msg: 'Could not find a fitting role for you', err }) }

          // If guestrole is found, continue and create new user
          else {
            const auth = new AuthSchema({ username, password: hash })
            const user = new UserSchema({ id, username, password, email, roles: [...doc], codeIds, registered, lastLogin })

            // First, save the auth, then user schema
            auth.save((err, doc) => {
              if (err) {
                console.log(err);
                res.status(500).send({ status: 'server-error', msg: 'Could not connect to database', err })
              } else {
                user.save((err, doc) => {
                  if (err) {
                    res.status(500).send({ status: 'server-error', msg: 'Could not connect to database', err })
                  } else {
                    res.status(201).send({ status: 'success', msg: 'User successfully saved to database', doc })
                  }
                });
              }
            });
          }
        });
      }
    })
  }
}

const handleGetUserList = (req, res) => {
  UserSchema.find({}, (err, doc) => {
    if(err) {
      res.status(500).send({ status: 'server-error', msg: 'Could not fetch users from database', err })
    } else if(doc === null) {
      res.status(404).send({ status: 'not-found', msg: 'No users found.', err })
    } else {
      res.status(200).send({ status: 'success', msg: `Fetched ${doc.length} users from database`, doc })
    }
  })
}

const handleGetUserById = (req, res) => {
  // Check if a parameter is passed
  if (!req.query.id) {
    res.status(400).send({ status: 'client-error', msg: 'The request URL did not contain the necessary parameters: id' })
  } else {
    const id = req.query.id;
    UserSchema.findOne({id}, (err, doc) => {
      if(err) {
        res.status(500).send({ status: 'server-error', msg: 'Could not fetch user from database', err })
      } else if(!doc) {
        res.status(404).send({ status: 'not-found', msg: `No user found with id ${id}.`, err })
      } else {
        res.status(200).send({ status: 'success', msg: `User with id ${id} found`, doc })
      }
    })
  }
}

const handleGetUsersByRole = (req, res) => {
  // Check if a parameter is passed
  if (!req.query.role) {
    res.status(400).send({ status: 'client-error', msg: 'The request URL did not contain the necessary parameters: role' })
  } else {
    const role = req.query.role;
    console.log(role)
    UserSchema.find({'roles.name': role}, (err, doc) => {
      if(err) {
        res.status(500).send({ status: 'server-error', msg: 'Could not fetch user from database', err })
      } else if(!doc) {
        res.status(404).send({ status: 'not-found', msg: `No user found with role ${role}.`, err })
      } else {
        res.status(200).send({ status: 'success', msg: `${doc.length} user with role ${role} found`, doc })
      }
    })
  }
}

module.exports = { handleCreateUser, handleGetUserList, handleGetUserById, handleGetUsersByRole }