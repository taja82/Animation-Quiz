var mongoose = require("mongoose");

// schema
var countrySchema = mongoose.Schema({
  country:{type:String},
  country_code:{type:String}
});

var Country = mongoose.model("country", countrySchema);
module.exports = Country;