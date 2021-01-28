var mongoose = require("mongoose");

// schema
var animeinfoSchema = mongoose.Schema({
  title:{type:Object},
  country:{type:String},
  country_code:{type:String},
  episode:{type:Number},
  //producer:{type:Object},
  description:{type:String},
  image_url:{type:String},
  site:{type:String},
  //series:{type:Array, default:[]},
  //series_index:{type:Number},
  manga:{type:String},
  tags:[String],
  year:{type:Number},
  opening:[String],
  ending:[String],
  create_date:{type:Date, default:Date.now},
  upload_date:{type:Date},
  coverimg:[Object],
  stealcut:[Object]
});

var AnimeInfo = mongoose.model("anime_info", animeinfoSchema);
module.exports = AnimeInfo;