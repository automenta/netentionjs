var express = require('express');
var ejs = require('ejs');
var fs = require('fs');


var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;

var agents, nodes;
var mongoServer = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('netention', mongoServer);
db.open(function(err, db) {
  if(!err) {
     console.log("DB connected");
     db.createCollection('agents', function(err, collection) {});
     db.createCollection('nodes', function(err, collection) {});     
  }
  else {
     console.log("DB: " + err);
  }
});

var server = express.createServer();
server.use(express.bodyParser());

//f = function(fileData, req, res) { }
function useTemplate(path, file, f) {
    server.get(path, function(req, res){
        fs.readFile(file, 'ascii', function(err, data){
            if(err) {                
                console.error(err);
                next();
            }

            f(data, req, res);
        });
    });
}

useTemplate('/index.html', 'index.html', function(data, req, res) {
    res.send( ejs.render(data, { }));
});

useTemplate('/agent/:agent', 'agent.html', function(data, req, res) {
    var agentID = req.params.agent;
  
    db.collection('agents', function(err, c) {
        c.findOne({ '_id': agentID}, function(err, agent) {
            var a = agent;
            if (agent == null) {
                a = newAgent();
                c.save( {'_id': agentID, 'agent': a }, { }, function(err, record){ });
            }
            res.send( ejs.render(data, {
                agent: [
                    agentID
                ]
            }));
        });
    });
    
});

function randomUUID() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function updateNode(agentID, nodeID, node) {
    db.collection('agents', function(err, c) {
        c.update({ '_id': agentID }, {$addToSet: { 'agent.nodes': nodeID }});
        db.collection('nodes', function(err, c) {
            c.save( {'_id': nodeID, 'node': node }, { }, function(err, record){ });
        });
    });
    
    return nodeID;
}

function newAgent() {
    return { nodes: [] };
}

function newNode(agentID, node) {
    var nodeID = randomUUID();
    updateNode(agentID, nodeID, node);
    return nodeID;
}


server.post('/agent/:agent/newnode', function(req,res) {
    var agentID = req.params.agent;
    var n = newNode(agentID, req.body.node);
    res.json(n);
});
server.get('/agent/:agent/json', function(req,res) {
    var agentID = req.params.agent;
    
    db.collection('agents', function(err, c) {
        c.findOne( { '_id': agentID }, function(err, result) {
            res.json(result.agent);
        });
    });        
});

server.get('/agent/:agent/nodes', function(req,res) {
    var agentID = req.params.agent;
    
    db.collection('agents', function(err, c) {
        c.findOne( { '_id': agentID }, function(err2, result) {        
            res.json(result.agent.nodes);
        });
    });        
});

server.get('/agents', function(req,res) {
    db.collection('agents', function(err, c) {
        c.find().toArray(function(err, results) {        
            var keys = [];
            for (var i = 0; i < results.length; i++)
                keys.push(results[i]._id);
            res.json(keys);
        });
    });        
});

server.get('/', function(req,res) {
    res.redirect('/index.html');
});
server.use(express.static(__dirname + '/file', {
    maxAge: 24*60*60*365
}));




server.listen(9090);

