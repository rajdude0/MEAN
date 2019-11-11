

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var jwtPermission = require('express-jwt-permissions');
var auth = jwt({secret:'SECRET', userProperty:'payload'});
var guard = jwtPermission({
   requestProperty: 'payload',
   permissionsProperty:'permissions'
})
require('../models/Posts');
require('../models/Comments');
require('../models/User');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

router.post('/posts', auth,guard.check('write'), function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;
  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});


router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id){
  //cosole.log(id);
 var query = Comment.findById(id);
 query.exec(function (err,comment){
   if(err) {return next(err);}
   if(!comment) {return next(new Error('can\'t find comment'));}
   req.comment = comment;
   return next();
 });

});

router.get('/posts/:post', function(req, res) {
  req.post.populate('comments',function(err,post){
    res.json(req.post)
  });

});

router.put('/posts/:post/upvote', auth, guard.check('update'), function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }
    res.json(post);
  });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req,res,next){
  //  console.log("hello");
    req.comment.upvote(function(err,comment){
      if(err) {return next(err);}

      res.json(comment);
    });


});

router.get('/allusers', auth, function(req, res, next) {
  return res.status(200).json(['ram', 'shyam', 'hari', 'deepak', 'raj', 'tony', 'peter']);
})

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;
  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});


router.post('/register',function(req,res,next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message:'Please fill out all fields.'});
  }

  var roles = ['read','write','update'];
  var user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password);
  user.role = roles;
  user.save(function(err){
    if(err){return next(err);}

    return res.json({token:user.generateJWT()})
  });
});


router.post('/login',function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message:'Please fill out all fields.'}) ;
  }
  passport.authenticate('local',function(err,user,info){
    if(err){return next(err);}
    if(user){
      req.session.save(function(err){
        if(err)
        console.log("Error while saving session");
        console.log('Session saved!');
      })
      return res.json({token:user.generateJWT()});
    }else{
      return res.status(401).json(info);
    }
  })(req,res,next);
});

router.post('/logout', auth, function(req, res, next){
  console.log(req.session);
  if(req.session){
   req.session.destroy(function(err){
     if(err) console.log('Error while destroying session');
     console.log("Session destroyed successfully..");
     res.status(200).end();
   })
  } else{
   res.status(501).end();
  }
});

module.exports = router;
