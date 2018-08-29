var express  = require("express");
var router   = express.Router();
var QA     = require("../models/QA");
var util     = require("../util");

// Index
router.get("/", function(req, res){
  QA.find({})
  .populate("author")
  .sort("-createdAt")
  .exec(function(err, qaposts){
    if(err) return res.json(err);
    res.render("qaposts/index", {qaposts:qaposts});
  });
});

// New
router.get("/new", util.isLoggedin, function(req, res){
  var post = req.flash("post")[0] || {};
  var errors = req.flash("errors")[0] || {};
  res.render("qaposts/new", { post:post, errors:errors });
});

// create
router.post("/", util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  QA.create(req.body, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/qaposts/new");
    }
    res.redirect("/qaposts");
  });
});

// show
router.get("/:id", function(req, res){
  QA.findOne({_id:req.params.id})
  .populate("author")
  .exec(function(err, post){
    if(err) return res.json(err);
    res.render("qaposts/show", {post:post, urlQuery:'', user: req.user});
  });
});

// edit
router.get("/:id/edit", util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash("post")[0];
  var errors = req.flash("errors")[0] || {};
  if(!post){
    QA.findOne({_id:req.params.id}, function(err, post){
      if(err) return res.json(err);
      res.render("qaposts/edit", { post:post, errors:errors });
    });
  } else {
    post._id = req.params.id;
    res.render("qaposts/edit", { post:post, errors:errors });
  }
});

// update
router.put("/:id", util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  QA.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash("post", req.body);
      req.flash("errors", util.parseError(err));
      return res.redirect("/qaposts/"+req.params.id+"/edit");
    }
    res.redirect("/qaposts/"+req.params.id);
  });
});

// destroy
router.delete("/:id", util.isLoggedin, checkPermission, function(req, res){
  QA.remove({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect("/qaposts");
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
  var post = await QA.findById(req.params.id);
  post.comments.push(newComment);
  await post.save();
  res.redirect('/qaposts/'+req.params.id);

  } catch(err) {
    return res.json({success:false, message:err});
  }
});

//destroy a comment
router.get('/:postId/comments/:commentId', function(req,res){
  QA.update({_id:req.params.postId},{$pull:{comments:{_id:req.params.commentId}}},
    function(err,post){
      if(err) return res.json({success:false, message:err});
      res.redirect('/qaposts/'+req.params.postId);
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  QA.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
