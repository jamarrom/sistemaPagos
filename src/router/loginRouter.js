const express = require("express");
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

const routerLogin = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const fakeLocal = require('../../fakeLocal.json');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fn = require('../js/funciones.js');


passport.use('login', new localStrategy({
  usernameField: 'username',
  passwordField: 'password',
}, async(username,password, done) => {
  try{
    let user = await findUser(username,password);

    if(user)
      return done(null,user,{message:'Prueba'});

    return done(null,false, { message: 'Los datos de accesos son incorrectos.'});

  }catch(e) {
    return done(e);
  }
}));

routerLogin.get("/",(req,res) => {
  let messageError = "";
  res.render("auth",{messageError});
});

routerLogin.post("/", async (req,res, next) => {
  passport.authenticate('login', async (err, user, info) => {
    try {
      if(err || user==0) {
        let messageError = "Datos de acceso incorrectos";
        res.render("auth",{messageError});
      }
      else {
        req.login(user, {session:false}, async (err) => {
          if (err) return next(err);

          const body = { _id: user }
          const token = fn.generateAccessToken(jwt, body);

          await fs.writeFile(
            "fakeLocal.json",
            JSON.stringify({"Authorization": `Bearer ${token}`}),
            (err) => {
              if(err) throw err
            }
          );
          const listClientes = await prisma.clientes.findMany({});
          res.render("admin",{listClientes});
        })
      }
    }
    catch(e) {
      return next(e);
    }
  })(req, res, next)
});

module.exports =  routerLogin;