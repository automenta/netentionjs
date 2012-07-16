var FeedParser = require('feedparser')
  , parser = new FeedParser()
  , request = require('request')

var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;

var agents, nodes;
var mongoServer = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('netention', mongoServer);

exports.db = db;

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
            node.author = agentID;
            c.save( {'_id': nodeID, 'node': node }, { }, function(err, record){ });
        });
    });
    
    return nodeID;
}

function newAgent() {
    return { nodes: [] };
}


