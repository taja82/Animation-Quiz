var express = require('express');
const app = require('../app');
var router = express.Router();
var Country = require("../models/Country");

/* GET home page. */
// Index
router.get("/", function(req, res){
  Country.find({})
  .exec(function(err, posts){
    if(err) return res.json(err);
    res.render("country/index", {posts:posts});
  });
});

// New
router.get("/new", function(req, res){
  res.render("country/new");
});

// create
router.post("/", function(req, res){
  Country.create(req.body, function(err, post){
    if(err){
      return res.redirect("/country/new");
    }
    res.redirect("/country");
  });
});

// show
router.get("/:id", function(req, res){
  Country.findOne({_id:req.params.id})
  .populate("author")
  .exec(function(err, post){
    if(err) return res.json(err);
    res.render("country/view", {post:post});
  });
});

// edit
router.get("/:id/edit", function(req, res){
  Country.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    res.render("country/edit");
  });
});

// update
router.put("/:id", function(req, res){
  req.body.updatedAt = Date.now();
  Country.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      
      return res.redirect("/country/"+req.params.id+"/edit");
    }
    res.redirect("/country/"+req.params.id);
  });
});

// destroy
router.delete("/:id", function(req, res){
  Country.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect("/country");
  });
});

module.exports = router;
