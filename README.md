What is Netention?
==================
For a high-level overview, watch the presentation at: http://automenta.com/netention

This documentation is in progress and will change frequently.

Setup
=====
Requirements:

    Node.JS     http://nodejs.org
    MongoDB     http://mongodb.org
        You may need to enable its port (27017), webserver, and REST:
        http://ajay555.wordpress.com/2011/06/08/mongodb-on-ubuntu-rest-is-not-enabled-use-rest-to-turn-on-error/
    npm         http://npmjs.org/
        
Ubuntu install everything: 

    apt-get install nodejs mongodb npm

Then install the npm packages:

    npm install mongodb feedparser express ejs fs apricot always now

Then run:

    node server.py

and visit:

    http://localhost:9090/agent/me


Development
===========
I'm using NetBeans 7.2 RC 1 with the Node.JS plugin.  

NetBeans already has decent Javascript/HTML/CSS editing support.

I also use:

    always server.py

...when i'm working mostly on the client code.  Though 'always' will keep the
application running and restart it if the server source code files change. :)