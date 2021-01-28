var express = require('express');
const app = require('../app');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function(req,res,next) {
  res.render('test');
});

router.get('/ttest', function(req,res,next) {
  res.render('ttest');
});

module.exports = router;
