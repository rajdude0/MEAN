var app = angular.module('weekDemo',['ui.router']);
app.config(['$stateProvider','$urlRouterProvider',
  function($stateProvider,$urlRouterProvider){
    $stateProvider
      .state('home',{
        url:'/home',
        templateUrl:'/home.html',
        controller:'MainController',
        resolve: {
       postPromise: ['posts', function(posts){
       return posts.getAll();
      }]
      }
      })
      .state('post',{
        url:'/posts/{id}',
        templateUrl:'/posts.html',
        controller:'PostsController',
        resolve: {
    post: ['$stateParams', 'posts', function($stateParams, posts) {
      return posts.get($stateParams.id);
    }]
  }
      })
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthenticationController',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      })
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthenticationController',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      });


      $urlRouterProvider.otherwise('home');
  }
])




app.factory('posts',['$http','auth',function($http,auth){
  var o = {
    posts:[]
  };
  o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };
  o.create = function(post) {
  return $http.post('/posts', post,{
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){

    o.posts.push(data);
  });
};

  o.addComment = function(id, comment) {
  return $http.post('/posts/' + id + '/comments', comment,{
    headers: {Authorization: 'Bearer '+auth.getToken()}
  });
};



o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote',null,{
    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
    .success(function(data){
      post.upvotes += 1;
    });
};

o.upvoteComment = function(post, comment) {

  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote',null,{
    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
    .success(function(data){

      comment.upvotes += 1;
    });
};

o.get = function(id) {
  return $http.get('/posts/' + id).then(function(res){
    return res.data;
  });
};

  return o;
}])
.factory('auth',['$http','$window',function($http,$window){
   var auth = {};
   auth.saveToken = function(token){
     $window.localStorage['week-demo']= token;
   };
   auth.getToken = function(){
     return $window.localStorage['week-demo'];
   }

   auth.isLoggedIn = function(){
     var token = auth.getToken();
     if(token){
       var payload = JSON.parse($window.atob(token.split('.')[1]));

       return payload.exp > Date.now() / 1000;
     } else{
       return false;
     }
   };

   auth.currentUser = function(){
     if(auth.isLoggedIn()){
       var token = auth.getToken();
       var payload = JSON.parse($window.atob(token.split('.')[1]));

       return payload.username;
     }
   };

   auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

   auth.logIn = function(user){
     return $http.post('/login',user).success(function(data){
       auth.saveToken(data.token);
     });
   };

  auth.logOut = function(){

    return $http.post('/logout',{},{
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      $window.localStorage.removeItem('week-demo');
    }).error(function(err){
      console.log(err);
    });
  }
   return auth;
}])


app.controller('PostsController',['$scope','posts','post','auth',function($scope,posts,post,auth){
  $scope.post = post;
  console.log(post.comments);
  $scope.incrementUpvotes = function(comment){
    //console.log(comment);
   //console.log(post);
  ///  comment.upvotes += 1;
    posts.upvoteComment(post, comment);
};
  $scope.addComment = function(){
    if($scope.body === '') { return; }
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user',
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
  };

  $scope.isLoggedIn = auth.isLoggedIn;





}
]);
app.controller('MainController',['$scope','posts','auth',function($scope,posts,auth){
    $scope.test = "hello this is my world";
    $scope.posts = posts.posts;
    console.log(posts.posts);

    $scope.addPost = function(){
    if(!$scope.title || $scope.title === '') { return; }
    posts.create({
      title: $scope.title,
      link: $scope.link,
    });
    $scope.title = '';
    $scope.link = '';

  };


  $scope.incrementUpvotes = function(post) {
 posts.upvote(post);
};

$scope.isLoggedIn = auth.isLoggedIn;

  }
]);

app.controller('AuthenticationController',['$scope','$state','auth',function($scope,$state,auth){
   $scope.user = {};
   $scope.register = function(){
     auth.register($scope.user).error(function(error){
       $scope.error = error;
     }).then(function(){
       $state.go('home');
     });
   }

   $scope.logIn = function(){
     auth.logIn($scope.user).error(function(error){
       $scope.error = error;
     }).then(function(){
       $state.go('home');
     });
   };

   $scope.isLoggedIn = auth.isLoggedIn;

}]);

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);
