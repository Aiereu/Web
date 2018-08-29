var express  = require("express");
var router   = express.Router();
var Books     = require("../models/Books");
var util     = require("../util");

// Index
router.get("/", function(req, res){
  Books.find({})
  .populate("author")
  .sort("-createdAt")
  .exec(function(err, books){
    if(err) return res.json(err);
    res.render("books/index", {books:books});
  });
});

// New
router.get("/new", util.isLoggedin, function(req, res){
  var post = req.flash("post")[0] || {};
  var errors = req.flash("errors")[0] || {};
  res.render("books/new", { post:post, errors:errors });
});

// create
router.post("/", util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Books.create(req.body, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/books/new");
    }
    res.redirect("/books");
  });
});

// show
router.get("/:id", function(req, res){
  Books.findOne({_id:req.params.id})
  .populate("author")
  .exec(function(err, post){
    if(err) return res.json(err);
    res.render("books/show", {post:post, urlQuery:'', user: req.user});
  });
});

// edit
router.get("/:id/edit", util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash("post")[0];
  var errors = req.flash("errors")[0] || {};
  if(!post){
    Books.findOne({_id:req.params.id}, function(err, post){
      if(err) return res.json(err);
      res.render("books/edit", { post:post, errors:errors });
    });
  } else {
    post._id = req.params.id;
    res.render("books/edit", { post:post, errors:errors });
  }
});

// update
router.put("/:id", util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Books.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/books/"+req.params.id+"/edit");
    }
    res.redirect("/books/"+req.params.id);
  });
});

// destroy
router.delete("/:id", util.isLoggedin, checkPermission, function(req, res){
  Books.remove({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect("/books");
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
  var post = await Books.findById(req.params.id);
  post.comments.push(newComment);
  await post.save();
  res.redirect('/books/'+req.params.id);

  } catch(err) {
    return res.json({success:false, message:err});
  }
});

//destroy a comment
router.get('/:postId/comments/:commentId', function(req,res){
  Books.update({_id:req.params.postId},{$pull:{comments:{_id:req.params.commentId}}},
    function(err,post){
      if(err) return res.json({success:false, message:err});
      res.redirect('/books/'+req.params.postId);
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Books.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
