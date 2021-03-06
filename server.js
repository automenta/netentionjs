var express = require('express');
var ejs = require('ejs');
var fs = require('fs');

var netention = require('./netention');
var rss = require('./rss');

var passport = require('passport')
  , OpenIDStrategy = require('passport-openid').Strategy;


passport.use(new OpenIDStrategy({
    returnURL: 'http://24.131.65.218:9090/auth/openid/return',
    realm: 'http://24.131.65.218:9090'
  },
  function(identifier, done) {
      console.log('Authenticated: ' + identifier);
      done(null, identifier);
  }
));

var server = express.createServer();

server.use(express.bodyParser());
server.use(express.favicon());
server.use(express.cookieParser());
server.use(passport.initialize());
server.use(passport.session());
server.use(express.static(__dirname + '/file', {
    maxAge: 24*60*60*365
}));

passport.serializeUser(function(user, done) {
    console.log('serializing: ' + user);
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(id, done) {
    console.log('deserializing: ' + id);
//  User.findOne(id, function (err, user) {
    done(null, JSON.parse(id));
//  });
});

//f = function(fileData, req, res) { }
function useTemplate(path, file, f) {
    server.get(path,  /*passport.authenticate('openid', { session: false , successFlash: 'Welcome' }),*/ function(req, res){
        fs.readFile(file, 'ascii', function(err, data){
            if(err) {                
                console.error(err);
                next();
            }
            console.log('serving ' + path + ' to ' + req.user);

            f(data, req, res);
        });
    });
}

function getAgentID() {    
    return 'Anonymous';
}

useTemplate('/nodes', 'node.html', function(data, req, res) {
    sendAgentPage(data, res, getAgentID(), 'showNodes();');
});



function sendAgentPage(data, res, agentID, onStartCode) {
    netention.getAgent(agentID, function (a) {
            res.send( ejs.render(data, {
                agent: a,
                onStart: onStartCode                
            }));        
    });    
}

useTemplate('/new', 'node.html', function(data, req, res) {
    var x = { _id: netention.randomUUID(), content: '' };
    sendAgentPage(data, res, getAgentID(), 'setNodeTo(' + JSON.stringify(x) + ');setEditable(true);');
});





server.post('/add/rss', function(req, res) {
    var url = req.body.url;
    rss.addRSS(url, function (n) {
        res.json(n);
    });
});


function withNode(nodeID, f/*(n)*/) {
   netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (err==null)
                f(result.node);
        });
   });        
}

useTemplate('/node/:node', 'node.html', function(data, req, res) {
    var nodeID = req.params.node;
    
    netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (result!=null) {
                result.node._id = nodeID;
                sendAgentPage(data, res, getAgentID(), 'setNodeTo(' + JSON.stringify(result.node) + ');');
            }
        });
    });        
});
useTemplate('/', 'node.html', function(data, req, res) {
    sendAgentPage(data, res, getAgentID(), 'showNodes();');
});

server.get('/node/:node/json', function(req,res) {
    var nodeID = req.params.node;
    
    netention.db.collection('nodes', function(err, c) {
        c.findOne( { '_id': nodeID }, function(err, result) {
            if (result!=null) {
                result.node._id = nodeID;
                res.json(result.node);
            }
        });
    });        
});
server.get('/node/:node/remove', function(req,res) {
    var nodeID = req.params.node;
    
    netention.db.collection('nodes', function(err, c) {
        c.remove( { '_id': nodeID }, function(err, result) {
            res.json(result);
        });
    });        
});


server.get('/login', function(req,res) { res.redirect('/login.html'); });



netention.start(function() {
    var app = server.listen(9090);

    var everyone = require("now").initialize(app);

    //everyone.now.distributeMessage = function(message){
    //  everyone.now.receiveMessage(this.now.name, message);
    //};
    everyone.now.forEachNode = netention.forEachNode;
    everyone.now.addSentencized = netention.addSentencized;
    everyone.now.updateNode = netention.updateNode;
    everyone.now.deleteNodes = netention.deleteNodes;
    everyone.now.forEachLink = netention.forEachLink;

    // Accept the OpenID identifier and redirect the user to their OpenID
    // provider for authentication.  When complete, the provider will redirect
    // the user back to the application at
    // /auth/openid/return
    server.post('/auth/openid', passport.authenticate('openid'));

    // The OpenID provider has redirected the user back to the application.
    // Finish the authentication process by verifying the assertion.  If valid,
    // the user will be logged in.  Otherwise, authentication has failed.
    server.get('/auth/openid/return', 
      passport.authenticate('openid', { successRedirect: '/',
                                        failureRedirect: '/login' }));    
});
