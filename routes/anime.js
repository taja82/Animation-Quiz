var express = require('express');
const app = require('../app');
var router = express.Router();
var Anime_info = require("../models/Anime_info");
var Country = require("../models/Country");

var fileupload = require("../fileupload");
fileupload.setUploadMidFolder("anime");
const sharp = require('sharp');
const multer = require('multer');

var fs = require('fs');
const mkdirp = require('mkdirp');
const path = require("path");

/* GET home page. */
// Index
router.get("/", function (req, res) {
  Anime_info.find({})
    .exec(function (err, posts) {
      if (err) return res.json(err);
      res.render("anime/index", { posts: posts });
    });
});

// New
router.get("/new", function (req, res) {
  Country.find({})
    .exec(function (err, countries) {
      if (err) return res.json(err);
      //console.log(countries);
      res.render("anime/new", { countries: countries });
    });

});



router.get('/test', function (req, res) {
  res.render('anime/upload_test');
});

router.get('/ttest', function (req, res) {
  res.render('anime/ttes');
});

router.get('/listtest', function(req,res) {
  res.render('anime/listtest')
});
router.post('/img_upload', fileupload.uploadImages, fileupload.resizeImages, fileupload.getResult, function (req, res) {
  //console.log(req.body);
  //console.log(req.files);
  return res.json({ response: { resultCode: 1, message: "완료" } });
});

// create
router.post("/", fileupload.uploadImages, fileupload.resizeImages, fileupload.getResult, function (req, res) {

  var title_json = {};
  title_json.ko = req.body.titleko;
  if (req.body.titlejp) {
    title_json.jp = req.body.titlejp;
  }
  if (req.body.titleromi) {
    title_json.jp_romi = req.body.titleromi;
  }
  req.body.title = title_json;

  var opening_json = {};
  var opening_array = [];
  for (var i = 0; i < req.body.opnum; i++) {
    if (req.body.opurl[i]) {
      opening_json.url = req.body.opurl[i];
    } else {
      opening_json.file = req.body.opfile[i];
    }
    opening_json.title = req.body.optitle[i];
    opening_json.startep = req.body.OPrange_start;
    opening_json.endep = req.body.OPrange_end;
    opening_array.push(opening_json);
  }
  req.body.opening = opening_array;


  var ending_json = {};
  var ending_array = [];
  for (var i = 0; i < req.body.ednum; i++) {
    if (req.body.edurl[i]) {
      ending_json.url = req.body.edurl[i];
    } else {
      ending_json.file = req.body.edfile[i];
    }
    ending_json.title = req.body.edtitle[i];
    ending_json.startep = req.body.EDrange_start;
    ending_json.endep = req.body.EDrange_end;
    ending_array.push(ending_json);
  }
  req.body.ending = ending_array;


  //console.log(req.body);

  Anime_info.create(req.body, function (err, post) {
    if (err) {
      return res.redirect("/anime/new");
    }
    res.redirect("/anime");
  });
});

router.get('/ttest', function (req, res, next) {
  res.render('ttest');
});

router.get('/test', function (req, res, next) {
  res.render('anime/test');
});

router.post('/posttest', function (req, res, next) {
  //console.log(req.body);
});

router.get("/removeall", function (req, res) {
  Anime_info.remove({}, function (err) {
    if (err) console.log(true);
    res.json({ text: "성공" });
  })
})

// show
router.get("/:id", function (req, res) {
  Anime_info.findOne({ _id: req.params.id })
    .populate("author")
    .exec(function (err, post) {
      if (err) return res.json(err);
      res.render("anime/view", { post: post });
    });
});

// edit
router.get("/:id/edit", function (req, res) {
  Anime_info.findOne({ _id: req.params.id }, function (err, post) {
    if (err) return res.json(err);
    res.render("anime/edit");
  });
});

// update
router.put("/:id", function (req, res) {
  req.body.updatedAt = Date.now();
  Anime_info.findOneAndUpdate({ _id: req.params.id }, req.body, { runValidators: true }, function (err, post) {
    if (err) {

      return res.redirect("/anime/" + req.params.id + "/edit");
    }
    res.redirect("/anime/" + req.params.id);
  });
});

// destroy
router.delete("/:id", function (req, res) {
  Anime_info.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return res.json(err);
    res.redirect("/anime");
  });
});

module.exports = router;
