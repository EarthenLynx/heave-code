// Import needed modules
const express = require("express");
const { handleAuthenticate, handleLogin } = require("../../controller/auth.controller")
const { authLog } = require('../../middleware/logger');

// Setup the router
const router = express.Router();

// Setup the logger middleware
router.use((req, res, next) => authLog(req, res, next))

router.post("/authenticate", (req, res) => {
  handleAuthenticate(req, res);
});

router.get('/login', (req, res) => {
  handleLogin(req, res)
})

module.exports = router;
