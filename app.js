const express = require("express");
const router = express();
const http = require('http');
const https = require('https');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const fs = require('fs');
// const fakeLocal = require('./fakeLocal.json');

var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');

const JWTStrategy = require('passport-jwt').Strategy;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Clie = require('./model/Clientes');
const cors = require('cors');
var Openpay = require('openpay');
var openpay = new Openpay('mc2lujsx0twl7jcqwbdr', 'sk_8a3c85f43aba4051b0df58b1625dcaea', false);
const conekta = require('conekta');
const routerErrors = require('./src/router/errores-en-http.js');
const routerLogin = require('./src/router/loginRouter.js');
require('dotenv').config();

conekta.api_key = 'key_murWAbLkhNI8NyyrG1Hs51g';
conekta.locale = 'es';

router.set('views', './views');
router.set('view engine','ejs')

router.use(express.static('public'));
router.use(express.urlencoded({ extended:false }));
router.use(express.json());
router.use(cors());

passport.use('login', new localStrategy({
  usernameField: 'username',
  passwordField: 'password',
}, async(username,password, done) => {
  try{
    let user = await findUser(username,password);

    if(user)
      return done(null,user,{message:'Logueado'});

    return done(null,false, { message: 'Los datos de accesos son incorrectos.'});

  }catch(e) {
    return done(e);
  }
}));

function getJwt() {
  return localStorage.getItem("jwtLogin");
  // return fakeLocal.Authorization?.substring(7);
}

passport.use(new JWTStrategy({
  secretOrKey: process.env.SECRET,
  jwtFromRequest: getJwt
}, async (token, done) => {
  try {
    return done(null, token._id);
  } catch (e) {
    console.log(e);
    done(error);
  }
}));

router.use(routerLogin);

router.get('/admin',passport.authenticate('jwt', { failureRedirect : '/', session: false }), async (req,res,next) => {
  const listClientes = await prisma.clientes.findMany({});
  res.render("admin",{listClientes});
});

router.get('/admin/cerrar-sesion',passport.authenticate('jwt', { session: false }), async (req,res,next) => {

  localStorage.setItem("jwtLogin", ``);

  // await fs.writeFile(
  //   "fakeLocal.json",
  //   JSON.stringify({ Authorization: ``}),
  //   (err)=> {
  //     if (err) throw err;
  //   }
  // )
  res.redirect("/");
});

router.get('/admin/alta-cliente',passport.authenticate('jwt', { failureRedirect : '/', session: false }), (req,res,next) => {
  let message = "";
  res.render("alta-cliente",{message});
});

router.post('/admin/alta-cliente',passport.authenticate('jwt', { session: false }), async (req,res, next) => {
  let fecha = new Date().toISOString();

  const nuevoCliente = await prisma.clientes.create({
    data:{
      nombre: req.body.txtNombre,
      apellidos: req.body.txtApellidos,
      email: req.body.txtEmail,
      telefono: req.body.txtTelefono,
      user_id: req.user,
      fecha: fecha,
      activo: 1
    }
  });

  let message = "Guardado";
  res.render("alta-cliente",{message});
});


router.get('/admin/editar-cliente/:id',passport.authenticate('jwt', { failureRedirect : '/', session: false }), async (req,res,next) => {
  let message = "";
  const { id } = req.params;

  const cliente = await prisma.clientes.findFirst({
    where: {
      cliente_id : parseInt(id)
    },
    select: {
      nombre: true,
      apellidos: true,
      telefono: true,
      email: true
    }
    });

  console.log(cliente);
  res.render("editar-cliente",{message,cliente});
});

router.post('/admin/editar-cliente/:id',passport.authenticate('jwt', { session: false }), async (req,res,next) => {
  let message = "Guardado";
  const { id } = req.params;

  const actualizarCliente = await prisma.clientes.update({
    where: {
      cliente_id : parseInt(id),
    },
    data:{
      nombre: req.body.txtNombre,
      apellidos: req.body.txtApellidos,
      telefono: req.body.txtTelefono,
      email: req.body.txtEmail,
    }
  });

  const cliente = await prisma.clientes.findFirst({
    where: {
      cliente_id : parseInt(id)
    },
    select: {
      nombre: true,
      apellidos: true,
      telefono: true,
      email: true
    }
    });

  console.log(cliente);
  res.render("editar-cliente",{message,cliente});
});

router.get('/admin/ordenes-de-pagos',passport.authenticate('jwt', { failureRedirect : '/', session: false }), async (req,res,next) => {
  const listOrdenesPagos = await prisma.ordenespagos.findMany({
    select: {
      orden_pago_id: true,
      monto: true,
      fecha: true,
      codigo_web: true,
      status_id:true,
      clientes: {
        select: {
          nombre: true,
          apellidos: true,
        },
      },
      status: {
        select: {
          status:true,
        },
      },
    },
    orderBy: {
      orden_pago_id: 'desc',
    }
  });

  res.render("ordenes-de-pagos",{listOrdenesPagos});
});

router.get('/admin/crear-orden-de-pago',passport.authenticate('jwt', { failureRedirect : '/', session: false }), async (req,res,next) => {
  let message = "";
  const listClientes = await prisma.clientes.findMany({
    select: {
      cliente_id: true,
      nombre: true,
      apellidos: true
    },
  });

  res.render("alta-orden-pago",{message,listClientes});
});


router.post('/admin/crear-orden-de-pago',passport.authenticate('jwt', { session: false }), async (req,res,next) => {
  const fecha = new Date().toISOString();
  const body = { cliente_id: req.body.stCliente, fecha: fecha }
  const token = generateAccessToken(body);

  const nuevoOrdenPago = await prisma.ordenespagos.create({
    data:{
      cliente_id: parseInt(req.body.stCliente),
      monto: parseFloat(req.body.txtMonto),
      codigo_web: token,
      status_id: 1,
      fecha: fecha
    }
  });

  let message = "Guardado";
  const listClientes = await prisma.clientes.findMany({
    select: {
      cliente_id: true,
      nombre: true,
      apellidos: true
    },
  });

  res.render("alta-orden-pago",{message,listClientes});
});


router.get('/admin/editar-orden-de-pago/:id',passport.authenticate('jwt', { failureRedirect : '/', session: false }), async (req,res,next) => {
  let message = "";
  const { id } = req.params;
  const listClientes = await prisma.clientes.findMany({
    select: {
      cliente_id: true,
      nombre: true,
      apellidos: true
    },
  });

  const ordenPago = await prisma.ordenespagos.findFirst({
    where: {
      orden_pago_id : parseInt(id)
    },
    select: {
      monto: true,
      cliente_id: true,
    }});
  res.render("editar-orden-de-pago",{message,listClientes,ordenPago});
});


router.post('/admin/editar-orden-de-pago/:id',passport.authenticate('jwt', { session: false }), async (req,res,next) => {
  let message = "Guardado";
  const { id } = req.params;


  const actualizarOrdenPago = await prisma.ordenespagos.update({
    where: {
      orden_pago_id : parseInt(id),
    },
    data:{
      cliente_id: parseInt(req.body.stCliente),
      monto: parseFloat(req.body.txtMonto),
    }
  });

  const listClientes = await prisma.clientes.findMany({
    select: {
      cliente_id: true,
      nombre: true,
      apellidos: true
    },
  });

  const ordenPago = await prisma.ordenespagos.findFirst({
    where: {
      orden_pago_id : parseInt(id)
    },
    select: {
      monto: true,
      cliente_id: true,
    }});
  res.render("editar-orden-de-pago",{message,listClientes,ordenPago});
});


router.get("/consultarOrdenPago", async (req,res) => {
  const data = req.query.ordenPago;

  const ordenPago = await prisma.ordenespagos.findFirst({
    where: {
      codigo_web : data
    },
    select: {
      orden_pago_id:true,
      monto: true,
      clientes: {
        select: {
          nombre:true,
          apellidos:true,
          telefono:true,
          email:true
        },
      },
      status: {
        select: {
          status_id:true,
        },
      },
    }});

  res.json({ordenPago});
});
 
router.post("/actualizarStatus", async (req,res) => {
  const fecha = new Date().toISOString();
  const actualizarStatusOrdenPago = await prisma.ordenespagos.update({
      where: {
        orden_pago_id : parseInt(req.body.order_pago_id),
      },
      data: {
        status_id: 2,
        customer: req.body.customer_id,
        order_id: req.body.order_id,
        openpay_id: req.body.token,
        fechapago: fecha,
      },
    });
    res.json({ "status":"Exito" });
});


router.post("/consultarIdOrdenPago", async (req,res) => {
  const orden_pago_id = parseInt(req.body.orden_pago_id);

  const ordenPago = await prisma.ordenespagos.findFirst({
    where: {
      orden_pago_id : orden_pago_id
    },
    select: {
      monto: true,
      customer: true,
      order_id: true,
      openpay_id: true,
      fecha: true,
      fechapago: true,
      clientes: {
        select: {
          nombre:true,
          apellidos:true,
          telefono:true,
          email:true
        },
      },
      status: {
        select: {
          status_id:true,
          status:true,
        },
      },
    }});

  res.json({ordenPago});
});


router.post("/consultarIdCliente", async (req,res) => {
  const cliente_id = parseInt(req.body.cliente_id);

  const cliente = await prisma.clientes.findFirst({
    where: {
      cliente_id : cliente_id
    },
    select: {
      nombre:true,
      apellidos:true,
      telefono:true,
      email:true,
      fecha:true,
      ordenespagos: {
        select: {
          monto:true,
          fecha:true,
          fechapago:true,
          status: {
            select: {
              status:true,
            },
          }
        },
      },
    }});

  res.json({cliente});
});

router.post("/cancelarOrdeDePago", async (req,res) => {
  const actualizarStatusOrdenPago = await prisma.ordenespagos.update({
      where: {
        orden_pago_id : parseInt(req.body.orden_pago_id),
      },
      data: {
        status_id: 3,
      },
    });
    res.json({ "status":"Exito" });
});



router.post("/procesarOrdenOpenpay", async (req,res) => {
  const total = req.body.totalCompra;

  const order = await conekta.Order.create({
    "currency": "MXN",
    "customer_info": {
      "name": req.body.txtNombre,
      "phone":'+52'+req.body.txtTelefono,
      "email": req.body.txtEmail
    },
    "line_items": [{
      "name": req.body.listaComprar,
      "unit_price": parseInt(total)*100,
      "quantity": 1
    }],
    "charges": [{
      "payment_method": {
        "type": "card",
        "token_id": req.body.txtKo
      }
    }],
      // function (error, body, response) {
      //
      // }
  });


  res.json({ "texto":"Exito", "customer_id": "", "orde_id":order.toObject()['id'],"openpay_id": req.body.txtKo  });

  // var newCustomer = {
  //   "name":req.body.txtNombre,
  //   "email":req.body.txtEmail,
  //   "last_name":req.body.txtApellidos,
  //   "phone_number":'+52'+req.body.txtTelefono
  // };

  // var customerId = "";
  // openpay.customers.create(newCustomer, async function (error, body, response)
  // {
  //   customerId = body.id;

  //   var newCharge = {
  //     "method": "card",
  //     "source_id":req.body.source_id,
  //     "amount" : total,
  //     "currency": "MXN",
  //     "description" : "Compra de: "+req.body.listaComprar,
  //     "order_id": "pagos-"+req.body.source_id,
  //     "device_session_id": req.body.device_session_id,
  //     "redirect_url": "http://localhost/pagos/aviso.php",
  //     "use_3d_secure": true,
  //   };

  //   openpay.customers.charges.create(
  //     customerId,
  //     newCharge,
  //     function (error, body, response) {
  //       res.json({ "texto":"Exito", "customer_id": customerId, "orde_id": body.order_id,"openpay_id": body.id, "url": body.payment_method.url  });
  //     }
  //   );
  // });
});


router.post("/validarPago", async (req,res) => {
  const customer_id = req.body.customer_id;
	const transccion_id = req.body.transccion_id;

  openpay.customers.charges.get(
    customer_id,
    transccion_id,
    function (error, body, response) {
      res.json({"status" : body.status});
    }
  );
});

function generateAccessToken(user) {
  return jwt.sign(user,process.env.SECRET, {expiresIn: 60*60*24});
}

async function findUser(email,password) {
  const users = await prisma.users.findFirst({
    where: {
      email,
      password
    },
    select: {
      user_id:true
    }});

    if(users == null)
      return 0;

    return users.user_id;
}

router.use(routerErrors);


let options = { cert: fs.readFileSync('certificados/certificate.crt'), ca: 
  fs.readFileSync('./certificados/ca_bundle.crt'), key: 
  fs.readFileSync('./certificados/private.key'),
};



// Servidor HTTP
// const serverHttp = http.createServer(router);
// serverHttp.listen(process.env.HTTP_PORT, process.env.IP);
// serverHttp.on('listening', () => console.info(`Notes App running at http://${process.env.IP}:${process.env.HTTP_PORT}`));
router.listen(3001, () => {
  console.log("Aplicación ejecutandose ....");
});



// Servidor HTTP
// const httpsServer = https.createServer(options, router);
// httpsServer.listen(443, process.env.IP);

