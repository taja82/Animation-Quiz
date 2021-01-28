var mongoose = require("mongoose");

// schema
var producerSchema = mongoose.Schema({
  name:{type:String},
  attach:{type:String},
  image_src:{type:String}
});

var Producer = mongoose.model("producer", producerSchema);
module.exports = Producer;