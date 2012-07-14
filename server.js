var nStore = require('nstore');
nStore = nStore.extend(require('nstore/query')());

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');

// Create a store
var agents = nStore.new('data/users.db', function () {
  // It's loaded now
});

var server = express.createServer();

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
      res.send( ejs.render(data, {
      }));
});

useTemplate('/agent/:agent', 'agent.html', function(data, req, res) {
    var agentID = req.params.agent;
  
    agents.get(agentID, function (err, doc, key) {
        
        var a = doc;
        
        if (err) { 
            var newUser = { };
            agents.save(agentID, { }, function(err) { 
                if (err) { throw err; }
            });
            a = newUser;
            
        }

        res.send( ejs.render(data, {
            agent: [
              agentID
            ]
        }));

    });

});

function getNodes(agent) {
    
}
server.get('/agents', function(req,res) {
    agents.all(function (err, results) {
        res.json(results);
    });
});

server.get('/', function(req,res) {
    res.redirect('/index.html');
});
server.use(express.static(__dirname + '/file', { maxAge: 24*60*60*365 }));

server.listen(3000);
