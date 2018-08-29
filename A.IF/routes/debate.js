var express  = require("express");
var router   = express.Router();
var Debate     = require("../models/Debate");
var util     = require("../util");

// Index
router.get("/", function(req, res){
  Debate.find({})
  .populate("author")
  .sort("-createdAt")
  .exec(function(err, debate){
    if(err) return res.json(err);
    res.render("debate/index", {debate:debate});
  });
});

// New
router.get("/new", util.isLoggedin, function(req, res){
  var post = req.flash("post")[0] || {};
  var errors = req.flash("errors")[0] || {};
  res.render("debate/new", { post:post, errors:errors });
});

// create
router.post("/", util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Debate.create(req.body, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/debate/new");
    }
    res.redirect("/debate");
  });
});

// show
router.get("/:id", function(req, res){
  Debate.findOne({_id:req.params.id})
  .populate("author")
  .exec(function(err, post){
    if(err) return res.json(err);
    res.render("debate/show", {post:post, urlQuery:'', user: req.user});
  });
});

// edit
router.get("/:id/edit", util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash("post")[0];
  var errors = req.flash("errors")[0] || {};
  if(!post){
    Debate.findOne({_id:req.params.id}, function(err, post){
      if(err) return res.json(err);
      res.render("debate/edit", { post:post, errors:errors });
    });
  } else {
    post._id = req.params.id;
    res.render("debate/edit", { post:post, errors:errors });
  }
});

// update
router.put("/:id", util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Debate.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/debate/"+req.params.id+"/edit");
    }
    res.redirect("/debate/"+req.params.id);
  });
});

// destroy
router.delete("/:id", util.isLoggedin, checkPermission, function(req, res){
  Debate.remove({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect("/debate");
  });
});

//create a comment
router.post('/:id/comments', async (req,res) => {
  var newComment = {
    author: req.user._id,
    date: new Date(),
    comment: req.body.comment
  };
  
  try {
  var post = await Debate.findById(req.params.id);
  post.comments.push(newComment);
  await post.save();
  res.redirect('/debate/'+req.params.id);

  } catch(err) {
    return res.json({success:false, message:err});
  }
});

//destroy a comment
router.get('/:postId/comments/:commentId', function(req,res){
  Debate.update({_id:req.params.postId},{$pull:{comments:{_id:req.params.commentId}}},
    function(err,post){
      if(err) return res.json({success:false, message:err});
      res.redirect('/debate/'+req.params.postId);
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Debate.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
