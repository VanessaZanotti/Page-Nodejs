const express = require('express');
const handlebars = require('express-handlebars');
const app = express();
const admin = require('./routes/admin');
const path = require('path');
const { default: mongoose } = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
require('./models/Postagem');
const Postagem = mongoose.model('postagens');
require('./models/Categorias');
const Categoria = mongoose.model('categorias');
const usuarios = require('./routes/usuario');
const passport = require('passport');
require('./config/auth')(passport);

//Configurações
app.use(
  session({
    secret: 'ProjetoNode',
    resave: true,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//Middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});
//HandleBars
app.engine(
  'handlebars',
  handlebars.engine({
    defaultLayout: 'main',
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,

      allowProtoMethodsByDefault: true,
    },
  }),
);
app.set('view engine', 'handlebars');

//Body Parser descontinuado, utilizando o express
app.use(express.json()); // para ler json
app.use(express.urlencoded({ extended: true })); // antes extended estava como false

//mongoose

mongoose
  .connect('mongodb://127.0.0.1:27017/blogapp')
  .then(() => {
    console.log('Conectado ao mongo');
  })
  .catch((err) => {
    console.log('Problemas ao se conectar no banco' + err);
  });
//Public

app.use(express.static(path.join(__dirname, 'public')));

//rotas

app.get('/', (req, res) => {
  Postagem.find()
    .populate('categoria')
    .sort({ data: 'desc' })
    .then((postagens) => {
      res.render('index', { postagens: postagens });
    })
    .catch((err) => {
      req.flash('error_msg', 'Houve um erro interno');
      res.redirect('/404');
    });
});

app.get('/postagem/:slug', (req, res) => {
  Postagem.findOne({ slug: req.params.slug })
    .then((postagem) => {
      if (postagem) {
        res.render('postagem/index', { postagem: postagem });
      } else {
        req.flash('error_msg', 'Essa postagem não existe!');
        res.redirect('/');
      }
    })
    .catch((err) => {
      req.flash('error_msg', 'Houve um erro interno.');
      res.redirect('/');
    });
});

app.get('/categorias', (req, res) => {
  Categoria.find()
    .then((categorias) => {
      res.render('categorias/index', { categorias: categorias });
    })
    .catch((err) => {
      req.flash('error_msg', 'Houve um erro interno ao listar as categorias.');
      res.redirect('/');
    });
});

app.get('/categorias/:slug', (req, res) => {
  Categoria.findOne({ slug: req.params.slug })
    .then((categoria) => {
      if (categoria) {
        Postagem.find({ categoria: categoria._id })
          .then((postagens) => {
            res.render('categorias/postagens', {
              postagens: postagens,
              categoria: categoria,
            });
          })
          .catch((err) => {
            req.flash('error_msg', 'Houve um erro ao listar os posts.');
            res.redirect('/');
          });
      } else {
        req.flash('error_msg', 'Esta categoria não existe.');
        res.redirect('/');
      }
    })
    .catch((err) => {
      req.flash(
        'error_msg',
        'Houve um erro interno ao carregar a página desta categoria.',
      );
      res.redirect('/');
    });
});

app.get('/404', (req, res) => {
  res.send('Erro 404!');
});

app.use('/admin', admin);
app.use('/usuarios', usuarios);
//outros
const PORT = 8081;
app.listen(PORT, () => {
  console.log('Servidor rodando!');
});
