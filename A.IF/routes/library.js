var express  = require("express");
var router   = express.Router();
var Library     = require("../models/Library");
var util     = require("../util");

// Index
router.get("/", function(req, res){
  Library.find({})
  .populate("author")
  .sort("-createdAt")
  .exec(function(err, library){
    if(err) return res.json(err);
    res.render("library/index", {library:library});
  });
});

// New
router.get("/new", util.isLoggedin, function(req, res){
  var post = req.flash("post")[0] || {};
  var errors = req.flash("errors")[0] || {};
  res.render("library/new", { post:post, errors:errors });
});

// create
router.post("/", util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Library.create(req.body, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/library/new");
    }
    res.redirect("/library");
  });
});

// show
router.get("/:id", function(req, res){
  Library.findOne({_id:req.params.id})
  .populate("author")
  .exec(function(err, post){
    if(err) return res.json(err);
    res.render("library/show", {post:post, urlQuery:'', user: req.user});
  });
});

// edit
router.get("/:id/edit", util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash("post")[0];
  var errors = req.flash("errors")[0] || {};
  if(!post){
    Library.findOne({_id:req.params.id}, function(err, post){
      if(err) return res.json(err);
      res.render("library/edit", { post:post, errors:errors });
    });
  } else {
    post._id = req.params.id;
    res.render("library/edit", { post:post, errors:errors });
  }
});

// update
router.put("/:id", util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Library.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/library/"+req.params.id+"/edit");
    }
    res.redirect("/library/"+req.params.id);
  });
});

// destroy
router.delete("/:id", util.isLoggedin, checkPermission, function(req, res){
  Library.remove({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect("/library");
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
  var post = await Library.findById(req.params.id);
  post.comments.push(newComment);
  await post.save();
  res.redirect('/library/'+req.params.id);

  } catch(err) {
    return res.json({success:false, message:err});
  }
});

//destroy a comment
router.get('/:postId/comments/:commentId', function(req,res){
  Library.update({_id:req.params.postId},{$pull:{comments:{_id:req.params.commentId}}},
    function(err,post){
      if(err) return res.json({success:false, message:err});
      res.redirect('/library/'+req.params.postId);
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Library.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
