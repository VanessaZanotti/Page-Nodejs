module.exports = {
  eAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.eAdmin == 1) {
      return next();
    }

    req.flash(
      'error_msg',
      'Você precisa de permissões administrativas para acessar esta área.',
    );
    res.redirect('/');
  },
};
