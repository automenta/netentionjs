/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var rdfstore = require('rdfstore');

//var store = new rdfstore.Store({persistent:true, 
//                    engine:'mongodb', 
//                    name:'rdf1', // quads in MongoDB will be stored in a DB named myappstore
//                    overwrite:false,    // delete all the data already present in the MongoDB server
//                    mongoDomain:'flame.mongohq.com', // location of the MongoDB instance, localhost by default
//                    mongoPort:27054 // port where the MongoDB server is running, 27017 by default
//                   }, function(store){
//                       console.log(store);
//});

//'localhost', 27017, {auto_reconnect: true}
var store = new rdfstore.Store({persistent:true, 
                    engine:'mongodb', 
                    name:'netention', // quads in MongoDB will be stored in a DB named myappstore
                    overwrite:false,    // delete all the data already present in the MongoDB server
                    mongoDomain:'localhost', // location of the MongoDB instance, localhost by default
                    mongoPort:27017 // port where the MongoDB server is running, 27017 by default
                   }, function(store){
//                       console.log(store);
});

console.log(store);
                      
store.execute('LOAD <http://dbpedialite.org/titles/Lisp_%28programming_language%29>\
               INTO GRAPH <lisp>', function(success){
  if(success) {
    var query = 'PREFIX foaf:<http://xmlns.com/foaf/0.1/> SELECT ?o \
                 FROM NAMED <lisp> { GRAPH <lisp> { ?s foaf:page ?o} }';
    store.execute(query, function(success, results) {
//      console.log(success);
        if (success) {
            console.log('RESULTS');
            console.log(results);
        }
    });
  }
});

store.registerDefaultProfileNamespaces();

store.graph("https://github.com/antoniogarrote/rdfstore-js", function(graph){
  console.log(graph);
    nameTriples = graph.match(null, null, null); 
                                  

    nameTriples.forEach(function(triple) {
      console.log(triple.object.valueOf());
    });  

var serialized = graph.toNT();
  console.log(serialized);
});

// simple query execution
store.execute("SELECT * { ?s ?p ?o } ", function(success, graph){
  if(success) {
    
    nameTriples = graph.match(null, null, null); 
                                  

    nameTriples.forEach(function(triple) {
      console.log(triple.object.valueOf());
    });  
    // process results        
//    if(results[0].s.token === 'uri') {
//      console.log(results[0].s.value);
//    }       
  }
});