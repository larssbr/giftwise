/*-----------------------------------------------------------------------------
A simple "Hello World" bot that can be run from a console window.

# RUN THE BOT:

    Run the bot from the command line using "node app.js" and then type 
    "hello" to wake the bot up.

-----------------------------------------------------------------------------*/

var builder = require('botbuilder');
var request = require('request');

var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);

var filters = ["gender","brand","size","color","season","price","sale","ageGroup","category"]
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
    // Function that asks for the range of price for buying product
    function (session, results) {

        session.userData.initial = luis(results.response); // why do we use luis here?
        builder.Prompts.text(session, "Okay, what's your price range? [x-y€]"); 
    },
    // Fucntion that asks you for the size you want. saved in session.userData.price varible
    function (session, results) {
        session.userData.price = results.response;
        //luis -> intent, entity
        builder.Prompts.text(session, "And what size are you? [s, m, l]"); 
    },

    // Function that returns boolean value of True and False to show sales or not. saved in session.userData.sale varible
    function (session, results) {
        //ession.userData.size = results.respons;
        session.userData.size = results.response;
        //luis -> intent, entity
        //builder.Prompts.number(session, "Do you want me to show only sales?");
        builder.Prompts.text(session, "do you want sale? [sale, nonSale]");
    },
    // this data will then be used to do a better "search"



    /*
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

    // This function shows the "search result" from the chat questions
    function (session, results) {
        session.userData.sale = results.response;
        console.log(session.userData.price, session.userData.size, session.userData.sale)
        var url = 'https://api.zalando.com/articles?price='+session.userData.price+'&size='+session.userData.size//+"&"+session.userData.initial[0]+'='+session.userData.initial[1]

        var urlSale = 'https://api.zalando.com/articles?price='+session.userData.price+'&size='+session.userData.size +'&sale=' + session.userData.sale //+"&"+session.userData.initial[0]+'='+session.userData.initial[1]

        request(urlSale, function (error, response, body) {
			if (!error && response.statusCode == 200) {
			   var cats = JSON.parse(body)
			   var cards =[];
			   for (var i = cats.content.length - 1; i >= 0; i--) {
			   	cards.push(cats["content"][i].name)
			   }
			   
			   builder.Prompts.choice(session, "Does any of the fit the bill?", cards);
			     }});
        
    },
    // ****************************************************************************************
    // This function takes the number answer and says that you got the result.
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.language + ".");
    }
]);
