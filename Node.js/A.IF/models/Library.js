var mongoose = require("mongoose");
var util     = require("../util");

// schema
var librarySchema = mongoose.Schema({
  title:{type:String, required:[true,"Title is required!"]},
  body:{type:String, required:[true,"Body is required!"]},
  author:{type:mongoose.Schema.Types.ObjectId, ref:"user", required:true},
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
    date: { type: Date, default: Date.now },
    comment: { type: String, required: true }
}],
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
},{
  toObject:{virtuals:true}
});

// virtuals
librarySchema.virtual("createdDate")
.get(function(){
  return util.getDate(this.createdAt);
});

librarySchema.virtual("createdTime")
.get(function(){
  return util.getTime(this.createdAt);
});

librarySchema.virtual("updatedDate")
.get(function(){
  return util.getDate(this.updatedAt);
});

librarySchema.virtual("updatedTime")
.get(function(){
  return util.getTime(this.updatedAt);
});

// model & export
var Library = mongoose.model("library", librarySchema);
module.exports = Library;
