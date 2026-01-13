// Not used anymore.
// The project is started from server.js.
// This file is kept as a placeholder.

module.exports = {
  upload: function () {
    return function (req, res) {
      res.status(501).send('Image upload is not configured in this copy. Use server.js');
    };
  }
};