/*-----------------------------------------------------------------------------
This template gets you started with a simple dialog that echoes back what the user said.
To learn more please visit
https://docs.botframework.com/en-us/node/builder/overview/
-----------------------------------------------------------------------------*/
//"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var azure = require('azure-storage');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
var request = require("request");

// Intercept trigger event (ActivityTypes.Trigger)
bot.on('trigger', function (message) {
    // handle message from trigger function
    var queuedMessage = message.value;
    var reply = new builder.Message()
        .address(queuedMessage.address)
        .text('This is coming from the trigger: ' + queuedMessage.text);
    bot.send(reply);
});
var luis = function(query){
	request("https://api.projectoxford.ai/luis/v2.0/apps/1ca69cad-7743-4016-bcfd-aa7fea2dee15?subscription-key=a57d3db3f47c4eacab1c9df496b2535f&q=I%20am%20small&verbose=true", function(error, response, body){
		var json = JSON.parse(body)
		console.log([json.intents[0].intent,json.entities[0].entity])
		return [json.intents[0].intent,json.entities[0].entity]
	});
}

bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Hello, what can I help you with?");
    },
    function (session, results) {

        session.userData.initial = luis(results.response);
        builder.Prompts.text(session, "Okay, what's your price range? [x-y€]");
    },
    function (session, results) {
        session.userData.price = results.response;
        //luis -> intent, entity
        builder.Prompts.text(session, "And what size are you? [s, m, l]");
    },/*
    function (session, results) {
        session.userData.size = results.respons;
        //luis -> intent, entity
        builder.Prompts.number(session, "Do you want me to show only sales?");
    },
    function (session, results) {
        session.userData.sale = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "How old are you?");
    },
    function (session, results) {
        session.userData.ageGroup = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "Are you looking for a specific brand?");
    },
    function (session, results) {
        session.userData.name = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "Okay, what's your price range?");
    },
    function (session, results) {
bot.dialog('/zalando', [
    function (session) {
        builder.Prompts.text(session, "Hello, what can I help you with?");
    },
    function (session, results) {

        session.userData.initial = luis(results.response);
        builder.Prompts.text(session, "Okay, what's your price range? [x-y€]");
    },
    function (session, results) {
        session.userData.price = results.response;
        //luis -> intent, entity
        builder.Prompts.text(session, "And what size are you? [s, m, l]");
    },/*
    function (session, results) {
        session.userData.size = results.respons;
        //luis -> intent, entity
        builder.Prompts.number(session, "Do you want me to show only sales?");
    },
    function (session, results) {
        session.userData.sale = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "How old are you?");
    },
    function (session, results) {
        session.userData.ageGroup = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "Are you looking for a specific brand?");
    },
    function (session, results) {
        session.userData.name = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "Okay, what's your price range?");
    },
    function (session, results) {
        session.userData.name = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "Okay, what's your price range?");
    },
    function (session, results) {
        session.userData.name = results.response;
        //luis -> intent, entity
        builder.Prompts.number(session, "Okay, what's your price range?");
    },*/


    function (session, results) {
        session.userData.size = results.response;
        console.log(session.userData.price, session.userData.size)
        var url = 'https://api.zalando.com/articles?price='+session.userData.price+'&size='+session.userData.size//+"&"+session.userData.initial[0]+'='+session.userData.initial[1]
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                cats = JSON.parse(body);
                cards = []
                btns = []
                thing = ""
                for (var i = cats["content"].length - 1; i >= 0; i--) {
                        //"https://api.zalando.com/articles/"+cats.content[i].id+"/media"
                        //json = JSON.parse(body);
                        //picURL = json.images[0].mediumUrl;
                        cards.push(new builder.HeroCard(session).title(cats["content"][i].name).text(cats["content"][i].name)
                        .images([
                        builder.CardImage.create(session, cats.content[i].media.images[0].mediumUrl)
                         .tap(builder.CardAction.showImage(session, cats.content[i].media.images[0].mediumUrl)),
                    ])
                        .buttons([builder.CardAction.imBack(session, "select:"+cats.content[i].id, "See similar"),
                            builder.CardAction.openUrl(session, cats.content[i].shopUrl, "See in Shop")]))
                    //btns.push(builder.CardAction.imBack(session, "select:"+i, "Select"));
                    thing = thing + "select:" + cats.content[i].id + "|"
                }
                     var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(cards);
                                //.buttons(btns);
                            builder.Prompts.choice(session, msg, thing);




                }});

    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        session.userData.id = kvPair[1];
        session.beginDialog('/similar')
    }
]);
bot.dialog('/similar',[    function (session, results) {

        console.log(session.userData.id)
        var url = 'https://api.zalando.com/recommendations/' + session.userData.id
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                cats = JSON.parse(body);
                cards = []
                btns = []
                thing = ""
                for (var i = cats.length - 1; i >= 0; i--) {

                        cards.push(new builder.HeroCard(session).title(cats[i].name).text(cats[i].name)
                        .images([
                        builder.CardImage.create(session, cats[i].media.images[0].mediumUrl)
                         .tap(builder.CardAction.showImage(session, cats[i].media.images[0].mediumUrl)),
                    ])
                        .buttons([builder.CardAction.imBack(session, "select:"+cats[i].id, "See similar"),
                            builder.CardAction.openUrl(session, cats[i].shopUrl, "See in Shop")]))
                    //btns.push(builder.CardAction.imBack(session, "select:"+i, "Select"));
                    thing = thing + "select:" + cats[i].id + "|"
                }
                     var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(cards);
                                //.buttons(btns);
                            builder.Prompts.choice(session, msg, thing);




                }});

    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        session.userData.id = kvPair[1];
        session.beginDialog('/similar')
    }] )

// Handle message from user
bot.dialog('/i', function (session) {
    var queuedMessage = { address: session.message.address, text: session.message.text };
    // add message to queue
    session.sendTyping();
    var queueSvc = azure.createQueueService(process.env.AzureWebJobsStorage);
    queueSvc.createQueueIfNotExists('bot-queue', function(err, result, response){
        if(!err){
            // Add the message to the queue
            var queueMessageBuffer = new Buffer(JSON.stringify(queuedMessage)).toString('base64');
            queueSvc.createMessage('bot-queue', queueMessageBuffer, function(err, result, response){
                if(!err){
                    // Message inserted
                    session.send('Your message (\'' + session.message.text + '\') has been added to a queue, and it will be sent back to you via a Function');

                    session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");

        /* Ask the user to select an item from a carousel.
        request('https://api.zalando.com/categories', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                cats = JSON.parse(body);
                cards = []
                for (var i = cats["content"].length - 1; i >= 0; i--) {
                    cards.push(new builder.HeroCard(session).title(cats["content"][i].name).text(cats["content"][i].name));
                     var msg = new builder.Message(session)
                                .textFormat(builder.TextFormat.xml)
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(cards);
                            builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
                }}});*/





//code



                } else {
                    // this should be a log for the dev, not a message to the user
                    session.send('There was an error inserting your message into queue');
                }
            });
        } else {
            // this should be a log for the dev, not a message to the user
            session.send('There was an error creating your queue');
        }
    });

});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}


