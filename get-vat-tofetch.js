'use strict';

const Hapi = require('hapi');
const db = require('./lib/db')

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    address: '0.0.0.0',
    port: 8000,
});

const options = {
    reporters: {
        console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' , error: '*'}]
        }, {
            module: 'good-console'
        }, 'stdout'],
    }
}

// Add the route
server.route([
    {
        method: 'GET',
        path:'/enterprises', 
        handler: function (request, reply) {
            reply(db.getCompaniesWithInformation(request.query.nb || 10).then(res => {
                console.log(request.headers)
                if(request.headers.accept && request.headers.accept.indexOf('application/json') === -1) return res.map(e => e[0]).join('\n')
                else return res
            }))
            
        }
    }, 
    {
        method: 'POST',
        path:'/enterprises/{id}/start', 
        handler: function (request, reply) {
            reply(db.companyFetchStart(request.params.id).then((result) => ({status: 'Starting'})))
        }    
    }, 
    {
        method: 'POST',
        path:'/enterprises/{id}/done', 
        handler: function (request, reply) {
            reply(db.companyFetchDone(request.params.id).then((result) => ({status: 'Finished'})))
        }    
    },
    {
        method: 'POST',
        path:'/enterprises/{id}/error', 
        handler: function (request, reply) {
            reply(db.companyFetchError(request.params.id).then((result) => ({status: 'Error'})))
        }    
    },
    {
        method: 'POST',
        path:'/enterprises/publications', 
        handler: function (request, reply) {
            reply(db.insertPublicationData(request.payload).then((result) => ({status: 'Error'})))
        }    
    }

]);


server.register({
    register: require('good'),
    options,
}).then(() => server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
}), (err) => console.error(err));

