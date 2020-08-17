var express = require('express');
var router = express.Router();
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var userModule = require('../modules/users');
var addProductModule = require('../modules/addProduct');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

function checkUserLogin(req,res,next){
  var userToken = localStorage.getItem("usertoken");
  try {
    var decode = jwt.verify(userToken,"loginToken")
  } catch (error) {
    res.redirect('/');
  }
  next();
}
function checkExistingUser(req,res,next){
  var username = req.body.uname;
  var checkuserName =userModule.findOne({username:username})
  checkuserName.exec((err,data)=>{
    if(err) throw err;
    if(data){
    return res.render('signup', { title: 'User Registration App',msg:'user name already exist' });
    }
    next();
  });
}
function checkExistingEmail(req,res,next){
  var email = req.body.email;
  var checkEmail =userModule.findOne({email:email});
  checkEmail.exec((err,data)=>{
    if(err) throw err;
    if(data){
     return res.render('signup', { title: 'User Registration App',msg:'Email already exist' });
    }
    next();
  });
}
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'User Registration App',msg:'' });
});
router.post('/', function(req, res, next) {
  var userName = req.body.uname;
  var password = req.body.password;
  var checkUser = userModule.findOne({username:userName});
  checkUser.exec(function(err,data){
    if(err) throw err;
    if(data){
      var gerUserID = data._id;
      var getPassword = data.password;
      if(bcrypt.compareSync(password,getPassword)){
        var token = jwt.sign({ userID: gerUserID }, 'loginToken');
        localStorage.setItem('usertoken',token);
        localStorage.setItem('username',userName);
        res.redirect('/dashboard');
      } else{
        res.render('index', { title: 'User Registration App',msg:'invalid user name or password' });
      }
    }
    else{
      res.render('index', { title: 'User Registration App',msg:'invalid user name or password' });
    }
  });
});

router.get('/signup',checkExistingUser,checkExistingEmail, function(req, res, next) {
  res.render('signup', { title: 'User Registration App',msg:'' });
});
router.post('/signup',checkExistingUser,checkExistingEmail, function(req, res, next) {
  var username = req.body.uname;
  var email = req.body.email;
  var password = req.body.password;
  var confPassword = req.body.confpassword;
  if(password != confPassword){
    res.render('signup', { title: 'User Registration App',msg:'password does not match' });
  }else{
    password = bcrypt.hashSync(req.body.password,10)
    var userModel = new userModule({
      username: username,
      email: email,
      password: password
    });
    userModel.save((err,data)=>{
      if(err) throw err;
      res.render('signup', { title: 'User Registration App',msg:'user Registered Successfully' });
  
    });
  }
});
router.get('/dashboard', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  res.render('dashboard', { title: 'User Registration App',msg:'',loginUser:loginUser });
});

router.get('/add-new-product', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  res.render('add-new-product', { title: 'User Registration App',msg:'',loginUser:loginUser,success:'',erros:'' });
});
router.post('/add-new-product', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  var productName = req.body.productname;
  var product = new addProductModule({
    product_name: productName
  });
  product.save((err,data)=>{
    if(err) throw err;
    res.render('add-new-product', { title: 'User Registration App',msg:'',loginUser:loginUser,success:'product added',erros:'' });
  })
});

router.get('/all-product', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  var product = addProductModule.find({});
  product.exec((err,data)=>{
    if(err) throw err;
    res.render('all-product', { title: 'User Registration App',msg:'',loginUser:loginUser,success:'',erros:'',records:data });
  });
});

router.post('/all-product', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  res.render('all-product', { title: 'User Registration App',msg:'',loginUser:loginUser,success:'',erros:'' });
});

router.get('/all-product/delete/:id', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  var productID = req.params.id;
  var delID = addProductModule.findByIdAndDelete(productID);
  delID.exec(function(err){
    if(err) throw err;
    res.redirect('/all-product');
  });
});
router.get('/all-product/edit/:id', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  var productID = req.params.id;
  var editID = addProductModule.findById(productID);
  editID.exec(function(err,data){
    if(err) throw err;
    res.render('edit-product', { title: 'User Registration App',msg:'',loginUser:loginUser,success:'',erros:'',id:productID,records:data });
  });
});

router.post('/all-product/edit/', checkUserLogin,function(req, res, next) {
  var loginUser = localStorage.getItem('username');
  var productID = req.body.id;
  var product_name = req.body.productname;
  var updateName = addProductModule.findByIdAndUpdate(productID,{product_name:product_name});
  updateName.exec(function(err,doc){
    if(err) throw err;
    res.redirect('/all-product')
  });
});
router.get('/logout', function(req, res, next) {
  localStorage.removeItem('usertoken');
  localStorage.removeItem("username");

 res.redirect('/');
});
module.exports = router;
