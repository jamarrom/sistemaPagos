const express = require("express");
const routerErrors = express.Router();

routerErrors.use(function(err, req, res, next) {
  if(401 == err.status) {
      res.redirect('/')
  }
});

routerErrors.use((req, res, next) => {
  res.status(404).redirect('/');
});

module.exports =  routerErrors;