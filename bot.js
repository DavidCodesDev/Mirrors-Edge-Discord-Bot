/*
After many people telling me I should post this on github I finally decided to do it, even though I have been hesitant because this code is of my early days...
...and still pretty amateuristic. I hope you can make good use of this code.

Welcome to the Mirror's Edge server discord bot. The bot is named Kuma and throws a ''runnerbag'' every X seconds. 
Once the bag is about to be thrown, the bot rolls a dice for the type of bag it will throw. Rarer bags give more points.
A Discord user types the !grab command once the bot has thrown the bag. The user who types it the fastest, grabs it.
Be careful of bombs! Accidently grabbing the bombs will deduct points instead. Type !runners to see the leaderboard
There are many more commands, you will see them as you read my comments.

Please note: When I first wrote this bot I 1. Did not know Javascript and 2. never thought It would become this big of a project, I began...
...writing this in a ''quick and dirty'' way, but it become so fun and so much used, I decided to slowly add more ''quick and dirty'' on top of...
''quick and dirty''. This is why I think this is lots of ''spaghetti code'' but I will soon refactor this.
*/

const Discord = require('discord.js'); 
var client = new Discord.Client(); //initiate a new client
const auth = require('./auth.json'); //json file with the authentication ID of the bot developer (me)

var fs = require('fs');
var tooLate = false;

const users = require('./users.json'); //this is the list of the users with their ID and points.

var filenameSecret = 'secretlist.txt'; //this is an extra special event file for community giveaways

var developmentMode = false; //When im busy coding this bot, i turn this on for debugging purposes, this makes the bot start in a private...
//...channel instead of the official channel.

var isLookingForCommand = false; //helper boolean to check if the bot can throw the next bag or not.
var canShowBag = true; //another helper boolean to show the bag
var botMessageID;  //a global variable about the bot's bag message, to delete the message later.

var secretArray1 = [];
var pointAddition = 1; //global variable for the amount of points to give.

var leaderBoard = {}; //initializing global variable for the leaderboard

var timeLeftStatus = 2 * 15; //amount of seconds the bag refreshes throw message refreshes

var keysSorted;

var winnerName;

var leaderboardTopNumber = 1;


client.on('ready', () => {

    console.log(`Logged in as ${client.user.tag}!`); //show a logged in message in the command line

    secretArray1 = fs.readFileSync('secretlist.txt').toString().split(','); //using the filestream library, we read the .txt file

    // runners = fs.readFileSync('runnerlist.txt').toString().split(',');
    // runnerScore = fs.readFileSync('scorelist.txt').toString().split(',').map(function(item) {
    //     return parseInt(item, 10);
    // });;

    leaderboardTopNumber = users.length;
    async function triggerLeaderboardSort(topRunnersNumber, startup = false, mentionedMemberId) {// this function will be triggered by typing !runners
        //this function reads the JSON file's data, assigns names to the ID's, sorts the leaderboard and displays it on discord.
        var newLeaderBoardTemp = {}; //empty the object variable

        leaderBoard = {};
        if(topRunnersNumber > users.length){ //You can type !runners (number) to only show the top X users, this code makes sure you didnt type it incorrectly 
            topRunnersNumber = users.length;
        }
        if(topRunnersNumber < 1){
            topRunnersNumber = users.length;
        }
        leaderboardTopNumber = topRunnersNumber;

                for(j = 1; j < users.length; j++){ //for some reason the 0st user gets skipped during this process, so I start at 1 instead and manually placed a dummy user at position 0.
                try{
                var user = await client.fetchUser(users[j].id); //In order to return the user account with the ID, you have to use this async await method...
                //... this ofcourse runs asynchrously and returns a Promise. DO NOT USE ''client.users.get(id)''. That only reads the cached users of the server, and if someone leaves...
                //...the bot will break. .fetchUser is the way to go.
                if(user != undefined || user != null){ 
                leaderBoard[user.username] = users[j].score; //we now populate the object with {name : score} from the JSON file
                }
                else{
                    console.log(users[j]);
                }
                }
                catch(err){
                    console.error(err);
                }
                }


                keysSorted = Object.keys(leaderBoard).sort(function(a,b){return leaderBoard[a]-leaderBoard[b]}); //we sort the populated object of users(keys) according to the values.

                valuesSorted = Object.keys(leaderBoard).sort(function(a,b){return leaderBoard[a]-leaderBoard[b]}).map(key => leaderBoard[key]); //now we sort the values

                for(j = (users.length -1); j > -1 + (users.length-leaderboardTopNumber -1); j--){//a for loop that only shows the top part (according to !runners (number))
                    newLeaderBoardTemp[keysSorted[j]] = valuesSorted[j]; //we repopulate the sorted users to the object that will be displayed.
                    }
                        if(mentionedMemberId != null || mentionedMemberId != undefined){ //typing !runners @user will show the leaderboard with only the..
                            //..mentioned user's name and the 2 users above and below them.
                        let arrayOfLeaderBoard = Object.keys(newLeaderBoardTemp); //the next lines just 
                        try{
                            var middleUser = await client.fetchUser(mentionedMemberId);
                        }
                        catch(err){
                            console.error(err);
                        }
                        let middleArrayNumber = arrayOfLeaderBoard.indexOf(middleUser.username);

                        const reversedValues = valuesSorted.reverse();

                        let middleArrayNumberUpperOne = middleArrayNumber -1;
                        let middleArrayNumberUpperTwo = middleArrayNumber -2;
                        let middleArrayNumberBottomOne = middleArrayNumber +1;
                        let middleArrayNumberBottomTwo = middleArrayNumber +2;
                            let middleLeaderBoard = {};
                            if(middleArrayNumber >2){
                            middleLeaderBoard[arrayOfLeaderBoard[middleArrayNumberUpperTwo]] = reversedValues[middleArrayNumberUpperTwo-1];
                            }
                            if(middleArrayNumber >1){
                            middleLeaderBoard[arrayOfLeaderBoard[middleArrayNumberUpperOne]] = reversedValues[middleArrayNumberUpperOne-1];
                            }
                            middleLeaderBoard[arrayOfLeaderBoard[middleArrayNumber]] = reversedValues[middleArrayNumber-1];
                            if(arrayOfLeaderBoard[middleArrayNumberBottomOne] != undefined){
                            middleLeaderBoard[arrayOfLeaderBoard[middleArrayNumberBottomOne]] = reversedValues[middleArrayNumberBottomOne-1];
                            }
                            if(arrayOfLeaderBoard[middleArrayNumberBottomTwo] != undefined){
                            middleLeaderBoard[arrayOfLeaderBoard[middleArrayNumberBottomTwo]] = reversedValues[middleArrayNumberBottomTwo-1];
                            }
                            console.log(middleLeaderBoard);

                            //We stringify the object variable so we can format it and then send it to the discord channel
                            let myJsonString = JSON.stringify(middleLeaderBoard);
                            let myEscapedJSONString = myJsonString.replace(/,/g,"\n")
                            .replace(/"/g, "")
                            .replace(/{/g, "")
                            .replace(/}/g, "");
                            specificChannel.send("```"+myEscapedJSONString+"```");

                        }
                        else{
                let myJsonString = JSON.stringify(newLeaderBoardTemp); //i understand I wrote this double and could easily put it in a function.
                let myEscapedJSONString = myJsonString.replace(/,/g,"\n")
                .replace(/"/g, "")
                .replace(/{/g, "")
                .replace(/}/g, "");

                if(startup === false){ //if this line has been reached during the startup of the bot, we do not display it.
                    //only when the user types the command.
                                specificChannel.send("```"+myEscapedJSONString+"```");
                }
                        }
            // client.user.setActivity(Object.keys(newLeaderBoardTemp)[1]+ " is #1!"); //sets the bot's status to User number is #1
            client.user.setActivity("Intruder! Alien entity! ALERT!"); //instead we use this now, and we update the bot status according to the thrown bag.

            }

    specificGuild = client.guilds.get('542312800656293889'); //guilds is another word for ''server'', Discord's decisions.
    if (developmentMode == false){
    specificChannel = specificGuild.channels.get('591194264114036737');
    }else{
    specificChannel = specificGuild.channels.get('685037802185949184');
    }
   triggerLeaderboardSort(users.length, true);
   specificChannel.send('*Booting up...*');

    if(specificChannel) {
        setInterval(() => {ThrowDice();
        }, timeLeftStatus * 1000); //seconds times 1000 ms. Every X seconds the bag throw function will be triggered.
    }

function PointAdditionFunction(userId, pointAmount = pointAddition){ //simple function to add points to the user that grabbed the bag.
    for(i = 0; i < users.length; i++){
        if(users[i].id === userId ){
            users[i].score = users[i].score + pointAmount;
            break;
        }
    }
    WriteUsersToJSON(); //and then we save that data to the JSON file.
}
function WriteUsersToJSON(){
    var fs = require('fs');
    fs.writeFile('users.json', JSON.stringify(users), function(err){
        if(err) {
            console.log(err)
        } else {
            console.log('File written!');
        }
    });
}
function SetActivityNumber(grabbed = false){ //fun bonus added to the bot's status.
    if(grabbed){
        client.user.setActivity("Intruder! Alien entity! ALERT!");

    }else{
        
    client.user.setActivity(pointAddition+" is up!");
    }
}

    function ThrowDice(){ //generates a random number 0 or 1 (so 50% chance of the bag actually being thrown, see below )
        RNG = Math.floor(Math.random() * 2);
        TossRunnerBag(RNG);
       
    }
    function TossRunnerBag(RNGNumber){ //this tosses the runnerbag after the chance RNG has been set
        function RemoveBomb (){
            isLookingForCommand = false;
            canShowBag = true;
            specificChannel.fetchMessage(botMessageID).then(msg => msg.delete());

        }
    if (RNGNumber == 1){//here we keep rolling dices to decide rarity, then we throw the bag according to the rarity. 
        //these ~200 lines can be written much better, I know, this is the quick and dirty part of my code I talked about
        RNG2 = Math.floor(Math.random() * 2);
        if(RNG2 == 1){
            RNG3 = Math.floor(Math.random() * 2);
            if(RNG3 == 1){
                RNG4 = Math.floor(Math.random() * 2);
                if(RNG4 == 1){
                    RNG5 = Math.floor(Math.random() * 2);
                    if(RNG5 == 1){
                        RNG6 = Math.floor(Math.random() * 2);

                        if(RNG6 == 1){
                            RNG7 = Math.floor(Math.random() * 3);
                            if (RNG7 == 1){
                                if (canShowBag == true){
                                    RNG7B = Math.floor(Math.random() * 4);
                                    if(RNG7B == 1){
                                        pointAddition = -64;//as you can see, the negative pointaddition is the bomb, we send the according message and set some flags to be used during the !grab command
                                        specificChannel.send("You found the secret source of all the runner bags? In the basement of EA DICE? DO NOT Type !grab to take the runner bags! " + ":bomb:" , { file: "https://i.imgur.com/19NCkpF.jpg"}).then(sent=> {
                                            botMessageID = sent.id;
                                            canShowBag = false;
                                            isLookingForCommand = true;
                                            SetActivityNumber();
                                        })

                                        var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000); //we remove the bomb message after 15 seconds.

                                        }
                                        else{
                                        pointAddition = 64;
                                        specificChannel.send("You found the secret source of all the runner bags! In the basement of EA DICE! Type !grab to take the runner bags! " + "<:runnerbag:641280524496928768>" , { file: "https://i.imgur.com/19NCkpF.jpg"}).then(sent=> {
                                            botMessageID = sent.id;
                                            canShowBag = false;
                                            isLookingForCommand = true;
                                            SetActivityNumber();
                                        })
                                          }
                                        }}else{
                                            if (canShowBag == true){
                                                RNG6B = Math.floor(Math.random() * 4);
                                                if(RNG6B == 1){
                                                pointAddition = -32;
                                                specificChannel.send('Hack the entire city of glass? DO NOT Type !grab to take the runner bags! ' + ":bomb:", { file: "https://i.imgur.com/kmIltZ6.png"}).then(sent=> {
                                                    botMessageID = sent.id;
                                                    canShowBag = false;
                                                    isLookingForCommand = true;
                                                    SetActivityNumber();
                                                })
                                                var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000);

                                            }else{
                                            pointAddition = 32;
                                            specificChannel.send('Hack the entire city of glass! Type !grab to take the runner bags! ' + "<:runnerbag:641280524496928768>", { file: "https://i.imgur.com/kmIltZ6.png"}).then(sent=> {
                                                botMessageID = sent.id;
                                                canShowBag = false;
                                                isLookingForCommand = true;
                                                SetActivityNumber();
                                                })
                                            }
                                        }
                                    }

                                                }else{

                                                if (canShowBag == true){
                                                    RNG5B = Math.floor(Math.random() * 4);
                                                    if(RNG5B == 1){
                                                        pointAddition = -16;

                                                        specificChannel.send('Quick runner, defeat the final boss Kruger to steal his 16 bombs? DO NOT Type !grab to take the runner bags! ' + ":bomb:", { file: "https://i.imgur.com/7qKcSqo.png"}).then(sent=>{
                                                            botMessageID = sent.id;
                                                            canShowBag = false;
                                                            isLookingForCommand = true;
                                                            SetActivityNumber();
                                                        })
                                                        var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000);

                                                    }
                                                    else{


                                                    pointAddition = 16;

                                                    specificChannel.send('Quick runner, defeat the final boss Kruger to steal his 16 bags! Type !grab to take the runner bags! ' + "<:runnerbag:641280524496928768>", { file: "https://i.imgur.com/7qKcSqo.png"}).then(sent=>{
                                                        botMessageID = sent.id;
                                                        canShowBag = false;
                                                        isLookingForCommand = true;
                                                        SetActivityNumber();
                                                    })
                                                    }
                                                }
                                            }
                                }else{
                                    if (canShowBag == true){
                                        RNG4B = Math.floor(Math.random() * 4);
                                    if(RNG4B == 1){ pointAddition = -8;
                                        specificChannel.send('Quick runner, hack the krugsec building to grab 8 bombs? DO NOT Type !grab to take the runner bags! ' + ":bomb:", { file: "https://i.imgur.com/Rr3Kyl2.png"}).then(sent => {
                                            botMessageID = sent.id;
                                            canShowBag = false;
                                            isLookingForCommand = true;
                                            SetActivityNumber();
                                        })
                                        var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000);
                                    }
                                else{
                                pointAddition = 8;
                                specificChannel.send('Quick runner, hack the krugsec building to grab 8 bags! Type !grab to take the runner bags! ' + "<:runnerbag:641280524496928768>", { file: "https://i.imgur.com/Rr3Kyl2.png"}).then(sent => {
                                    botMessageID = sent.id;
                                    canShowBag = false;
                                    isLookingForCommand = true;
                                    SetActivityNumber();
                                })
                            }
                        }
                    }
                }else{
                if (canShowBag == true){

            RNG3B = Math.floor(Math.random() * 4);
            if(RNG3B == 1){
                pointAddition = -4;
                specificChannel.send('Quick runner, defeat the krugsec enemies to grab 4 bombs? DO NOT Type !grab to take the runner bags! ' + ":bomb:", { file: "https://i.imgur.com/eOU62SR.jpg"}).then(sent => {
                    botMessageID = sent.id;
                    canShowBag = false;
                    isLookingForCommand = true;
                    SetActivityNumber();
                })
                var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000);

                }
                else{

                    pointAddition = 4;
                    specificChannel.send('Quick runner, defeat the krugsec enemies to grab 4 bags! Type !grab to take the runner bags! ' + "<:runnerbag:641280524496928768>", { file: "https://i.imgur.com/eOU62SR.jpg"}).then(sent => {
                        botMessageID = sent.id;
                        canShowBag = false;
                        isLookingForCommand = true;
                        SetActivityNumber();
                    })
                }
            }
        }
            }
            else{
                if (canShowBag == true){

                    RNG2B = Math.floor(Math.random() * 4);
if(RNG2B== 1){
    pointAddition = -2;
    specificChannel.send('Quick runner, 2 runners are escaping with bombs? DO NOT Type !grab to steal the runner bags! ' + ":bomb:", { file: "https://i.imgur.com/jXQtZme.jpg"}).then(sent =>{
        botMessageID = sent.id;
        canShowBag = false;
    isLookingForCommand = true;
    SetActivityNumber();
    })
    var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000);

    }
    else{

                    pointAddition = 2;
                    specificChannel.send('Quick runner, 2 runners are escaping with bags! Type !grab to steal the runner bags! ' + "<:runnerbag:641280524496928768>", { file: "https://i.imgur.com/jXQtZme.jpg"}).then(sent =>{
                        botMessageID = sent.id;
                        canShowBag = false;
                    isLookingForCommand = true;
                    SetActivityNumber();
                    })
                }

            }
    }
        }
        else{
        if (canShowBag == true){


            RNG1B = Math.floor(Math.random() * 4);
            if(RNG1B == 1){
                pointAddition = -1;
                specificChannel.send('Quick runner! DO NOT Type !grab to catch the runner bag!! ' + ":bomb:", { file: "https://i.imgur.com/WOFEhLF.png"}).then(sent =>{
                    botMessageID = sent.id;
                })
                canShowBag = false;
                    isLookingForCommand = true;
                    SetActivityNumber();

                    var bombTimeout = setTimeout(function(){ RemoveBomb();}, 15000);
            }
            else{

pointAddition = 1;
        specificChannel.send('Quick runner! Type !grab to catch the runner bag! ' + "<:runnerbag:641280524496928768>", { file: "https://i.imgur.com/WOFEhLF.png"}).then(sent =>{
            botMessageID = sent.id;
        })
        canShowBag = false;
            isLookingForCommand = true;
            SetActivityNumber();
            }
    }
}


}
    }
    client.on('message', msg =>{

    if(msg.channel.id === specificChannel.id){ //if the user's message was in the #bots channel...


if(msg.content == '!shutdown'){//this part is my part, its just a way to let the users know that the bot has been shut down
    //in reality I shut it down in the commandline manually.

    if(msg.member.id === '535578716756246529'){//my user ID
    specificChannel.send('*Shutting down...*');
    }
else{
    specificChannel.send('*I only listen to Plastic!*'); //Plastic is my name in the server.

}}
//all these next lines are commands for mirrors edge themed responses, the bot just responds with the command's fitting image.
        if(msg.content == '!isabel'){
            specificChannel.send(' ', { file: "https://i.imgur.com/RUYczjw.png"});
        }
        if(msg.content == '!faith'){
            specificChannel.send(' ', { file: "https://i.imgur.com/rSpfNgj.jpg"});
        }
        if(msg.content == '!gabriel' || msg.content == '!kruger'){
            specificChannel.send(' ', { file: "https://i.imgur.com/OOoZozG.jpg"});
        }
        if(msg.content == '!noah'){
            specificChannel.send(' ', { file: "https://i.imgur.com/LEz3GIP.png"});
        }
        if(msg.content == '!icarus'){
            specificChannel.send(' ', { file: "https://i.imgur.com/Iu9S3BF.jpg"});
        }
        if(msg.content == '!birdman'){
            specificChannel.send(' ', { file: "https://i.imgur.com/OPe4tPX.png"});
        }
        if(msg.content == '!beatrix'){
            specificChannel.send(' ', { file: "https://i.imgur.com/6bZ38zL.jpg"});
        }
        if(msg.content == '!jacknife'){
            specificChannel.send(' ', { file: "https://i.imgur.com/3hMCXzG.png"});
        }
        if(msg.content == '!celeste'){
            specificChannel.send(' ', { file: "https://i.imgur.com/cIhxmPO.png"});
        }
        if(msg.content == '!woof'){//what can I say, I love dogs
            specificChannel.send(' ', { file: "https://i.imgur.com/JaxL5c1.jpg"});
        }
        if(msg.content == '!neweden'){
            specificChannel.send(' ', { file: "https://i.imgur.com/F5LXyWV.png"});
        }
        if(msg.content == '!dogen'){
            specificChannel.send(' ', { file: "https://i.imgur.com/bK4S4F9.png"});
        }
        if(msg.content == '!plastic'){
            specificChannel.send(' ', { file: "https://i.imgur.com/fmZZ96c.jpg"});
        }
        if(msg.content == '!aline'){
            specificChannel.send(' ', { file: "https://i.imgur.com/uFqfzmU.jpg"});
        }
        if(msg.content == '!nomad'){
            specificChannel.send(' ', { file: "https://i.imgur.com/Pe7AXDh.jpg"});
        }
        if(msg.content == '!martin'){
            specificChannel.send(' ', { file: "https://i.imgur.com/u3XdwQD.jpg"});
        }
        if(msg.content == '!erika'){
            specificChannel.send(' ', { file: "https://i.imgur.com/6S7qwas.jpg"});
        }
        if(msg.content == '!travis'){
            specificChannel.send(' ', { file: "https://i.imgur.com/5cQdPia.jpg"});
        }
        if(msg.content == '!mercury'){
            specificChannel.send(' ', { file: "https://i.imgur.com/BkjlYrG.png"});
        }
        if(msg.content == '!camera'){
            specificChannel.send(' ', { file: "https://i.imgur.com/DV2WK19.jpg"});
        }
        if(msg.content == '!drone'){
            specificChannel.send(' ', { file: "https://i.imgur.com/Qvszrtq.jpg"});
        }
        if(msg.content == '!kuma'){
            specificChannel.send(' ', { file: "https://i.imgur.com/J9CJWaD.jpg"});
        }
        if(msg.content == '!kreeg'){
            specificChannel.send(' ', { file: "https://i.imgur.com/80Um0E1.jpg"});
        }
        if(msg.content == '!abraham'){
            specificChannel.send(' ', { file: "https://i.imgur.com/tBOP1ns.jpg"});
        }
        if(msg.content == '!austin'){
            specificChannel.send(' ', { file: "https://i.imgur.com/2plTHUQ.jpg"});
        }
        if(msg.content == '!avani'){
            specificChannel.send(' ', { file: "https://i.imgur.com/EaUJrZe.jpg"});
        }
        if(msg.content == '!red'){
            specificChannel.send(' ', { file: "https://i.imgur.com/xCblXkB.jpg"});
        }
        if(msg.content == '!blue'){
            specificChannel.send(' ', { file: "https://i.imgur.com/hZyrCxq.png"});
        }
        if(msg.content == '!crab'){
            specificChannel.send(' ', { file: "https://i.imgur.com/YRqZMXZ.png"});
        }
        if(msg.content == '!g'){
            specificChannel.send(' ', { file: "https://i.imgur.com/MN8jiIX.png"});
        }
        if(msg.content == '!e'){
            specificChannel.send(' ', { file: "https://i.imgur.com/l7xgkWS.png"});
        }
        if(msg.content == '!hoagy'){
            specificChannel.send(' ', { file: "https://i.imgur.com/sz7kyiR.jpg"});
        }
        if(msg.content == '!aurore'){
            specificChannel.send(' ', { file: "https://i.imgur.com/wsSqjs3.jpg"});
        }
        if(msg.content == '!caleb'){
            specificChannel.send(' ', { file: "https://i.imgur.com/0T2swbI.jpg"});
        }
        if(msg.content == '!leaf'){
            specificChannel.send(' ', { file: "https://i.imgur.com/aNnYSRA.jpg"});
        }
        if(msg.content == '!mark'){
            specificChannel.send(' ', { file: "https://i.imgur.com/KDf6U6e.png"});
        }
        if(msg.content == '!drake'){
            specificChannel.send(' ', { file: "https://i.imgur.com/LjS68Ot.jpg"});
        }
        if(msg.content == '!dusky'){
            specificChannel.send(' ', { file: "https://i.imgur.com/IR0u4YO.jpg"});
        }
        if(msg.content == '!hank'){
            specificChannel.send(' ', { file: "https://i.imgur.com/agU8Xo8.png"});
        }
        if(msg.content == '!rubbers'){
            specificChannel.send(' ', { file: "https://i.imgur.com/xUkzI1P.png"});
        }
        if(msg.content == '!anchor'){
            specificChannel.send(' ', { file: "https://i.imgur.com/Kg52D3T.jpg"});
        }
        if(msg.content == '!centurian'){
            specificChannel.send(' ', { file: "https://i.imgur.com/w3j9TY9.jpg"});
        }
        if(msg.content == '!charter'){
            specificChannel.send(' ', { file: "https://i.imgur.com/HV5nDNr.jpg"});
        }
        if(msg.content == '!concord'){
            specificChannel.send(' ', { file: "https://i.imgur.com/NCQYPLF.jpg"});
        }
        if(msg.content == '!shard'){
            specificChannel.send(' ', { file: "https://i.imgur.com/aHhc4M1.jpg"});
        }
        if(msg.content == '!development'){
            specificChannel.send(' ', { file: "https://i.imgur.com/WBHFCfs.jpg"});
        }
        if(msg.content == '!downtown'){
            specificChannel.send(' ', { file: "https://i.imgur.com/bCZ196I.jpg"});
        }
        if(msg.content == '!eden'){
            specificChannel.send(' ', { file: "https://i.imgur.com/AXChMNp.jpg"});
        }
        if(msg.content == '!greylands'){
            specificChannel.send(' ', { file: "https://i.imgur.com/qUGIaPi.jpg"});
        }
        if(msg.content == '!view'){
            specificChannel.send(' ', { file: "https://i.imgur.com/qFH579I.jpg"});
        }
        if(msg.content == '!regatta'){
            specificChannel.send(' ', { file: "https://i.imgur.com/48Lc0W3.jpg"});
        }
        if(msg.content == '!rezoning'){
            specificChannel.send(' ', { file: "https://i.imgur.com/6x78sEm.jpg"});
        }
        if(msg.content == '!gridnode'){
            specificChannel.send(' ', { file: "https://i.imgur.com/twrGurN.jpg"});
        }
        if(msg.content == '!shimmering'){
            specificChannel.send(' ', { file: "https://i.imgur.com/nMhAbpr.jpg"});
        }
        if(msg.content == '!triumvirate'){
            specificChannel.send(' ', { file: "https://i.imgur.com/kHguM6Q.jpg"});
        }
        if(msg.content == '!rudders'){
            specificChannel.send(' ', { file: "https://i.imgur.com/NGNsfw6.png"});
        }
        if(msg.content == '!therandomwomanfromreallifethathappenedtoendupinmecbecausedicedecidedtoscanthenewspapershewasinandputitinthegame'){
            specificChannel.send(' ', { file: "https://i.imgur.com/DBQ7UYG.jpg"}); 
        }
        if(msg.content == '!zuckerberg'){
            specificChannel.send(' ', { file: "https://i.imgur.com/P6lCdHU.png"});
        }
        if(msg.content == '!garb'){
            specificChannel.send(' ', { file: "https://i.imgur.com/hrfCoC2.png"});
        }
        if(msg.content == '!rat'){
            specificChannel.send(' ', { file: "https://i.imgur.com/n2H4bAX.jpg"});
        }
        if(msg.content == "!clean"){ //remove all the users with lower than 10 points
            for(var i = users.length - 1; i > 0; --i){
                if(users[i].score < 10){
                    users.splice(i,1);
                }
            }
            WriteUsersToJSON();
        }
        if(msg.content.startsWith('!give')) {  //this is the trading system, the higher you are on the list, the higher the fee will be. 90%, 80%, 70% etc.
            const reversedKeys = keysSorted.reverse();
                if(msg.mentions.members.first()){
                    var args = msg.content.split(" ");
                    var donationNumber = parseInt(args[2]);
                    if(Number.isInteger(donationNumber)){
                        var userObj = users.find(({id}) => id === msg.member.id.toString());
                        var usersScore = userObj.score;
                        if(donationNumber > 0 && donationNumber < usersScore){
                            var limit = Math.floor(usersScore/20);
                            if(donationNumber <= limit){
                                PointAdditionFunction(msg.member.id,-donationNumber);
                                var index = reversedKeys.findIndex(name => name === msg.member.user.username);
                                console.log(index);
                                if(index < 8){
                                    var numberToAdd = Math.floor(donationNumber / 100 * ((index+2) * 10));
                                    PointAdditionFunction(msg.mentions.members.first().id,numberToAdd);
                                    specificChannel.send('*Transaction succesful! - sent: '+numberToAdd+' bags. With a fee of '+ (donationNumber-numberToAdd)+' bags'+'*');
                                }
                                else{
                                    PointAdditionFunction(msg.mentions.members.first().id,donationNumber);
                                    specificChannel.send('*Transaction succesful! - sent: '+donationNumber+' bags*');
                                }                          
                            }   
                            else{
                                specificChannel.send('*Error: You can not send more than '+limit+' bags!*');
                            }
                        }
                        else{
                            specificChannel.send('*Error: Bag amount must be less than your current amount and higher than 0.*');
                        }
                    }
                    else{
                        specificChannel.send('*Error: No valid number of bags.*');
                    }
                }
                else{
                }
        }
        if(msg.content.startsWith('!runners')){//here is all the logic for the different variants of !runners
            var args = msg.content.split(" ");
            if(args.length >1){
            if(Number.isInteger(parseInt(args[1])) ){//if the user typed a number, we display the leaderboard with the top X
                    triggerLeaderboardSort(parseInt(args[1]));
            }
            else if(args[1] === ""){//safety net
                triggerLeaderboardSort(users.length);
            return;
            }
            else if(msg.mentions.members.first()){ //is there a mention? then plug that mention into the leaderboard and compute see how it works in the function above
                triggerLeaderboardSort(users.length, false, msg.mentions.members.first().id);
            }
            else{
                triggerLeaderboardSort(users.length);
            }
                        }else{//if none of the above apply (so if only !runners has been typed) then just sort normally
                            triggerLeaderboardSort(users.length);
                        }
                    msg.reply('Type !givemerole to give yourself a City of Glass status. The more bags you have the higher your level!');
                    }
                    if(msg.content == "!givemerole"){//if the user sees they have enough points for a role, they can give it to themselves.
                        //note, type !runners to update your points first into the leaderboard variable.
                        var runnerBagsPointsAmount = leaderBoard[msg.member.user.username]; 
                        if(runnerBagsPointsAmount == null){
                        msg.reply('You need to grab at least 1 bag to use that command, wait for a bag to pop up every 2-3 minutes!');
                        }
                        if(runnerBagsPointsAmount > 0 && runnerBagsPointsAmount < 100){
                            msg.reply('You have not collected enough bags yet! Reach 100 points to gain MidCaste status in the City of Glass!');
                        }
                        if(runnerBagsPointsAmount > 99 && runnerBagsPointsAmount < 500){
                            if(msg.member.roles.find(r => r.id === "624705024664272917")){
                                msg.reply('You are already MidCaste! Reach 500 points to gain HiCaste status in the City of Glass!');
                            }
                            else{
                            msg.member.removeRole('673185630184013875'); //removes Isabel
                            msg.member.removeRole('673183370296950803'); //removes Corporate House
                            msg.member.removeRole('668205332983709747'); //removes Kruger
                            msg.member.removeRole('624705219011411998'); //removes HiCaste
                            msg.member.removeRole('666017463837917203'); //removes eXec;
                            msg.member.addRole('624705024664272917'); //adds MidCaste;
                            msg.reply('You are now MidCaste in the City of Glass!');
                            }
                        }
                        if(runnerBagsPointsAmount > 499 && runnerBagsPointsAmount < 1000){
                            if(msg.member.roles.find(r => r.id === "624705219011411998")){
                                msg.reply('You are already HiCaste! Reach 1000 points to gain eXec status in the City of Glass!');
                            }
                            else{
                            msg.member.removeRole('668205332983709747'); //removes Kruger
                            msg.member.removeRole('673183370296950803'); //removes Corporate House
                            msg.member.removeRole('673185630184013875'); //removes Isabel
                            msg.member.removeRole('666017463837917203'); //removes eXec;
                            msg.member.removeRole('624705024664272917'); //remove MidCaste;
                            msg.member.addRole('624705219011411998'); //add HiCaste
                            msg.reply('You are now HiCaste in the City of Glass!');
                            }
                        }
                        if(runnerBagsPointsAmount > 999 && runnerBagsPointsAmount < 2000){
                            if(msg.member.roles.find(r => r.id === "666017463837917203")){
                                msg.reply('You are already eXec! Reach 2000 points to gain Corporate House status in the City of Glass!');
                            }
                            else{
                            msg.member.removeRole('668205332983709747'); //removes Kruger
                            msg.member.removeRole('673183370296950803'); //removes Corporate House
                            msg.member.removeRole('673185630184013875'); //removes Isabel
                            msg.member.removeRole('624705024664272917'); //remove MidCaste;
                            msg.member.removeRole('624705219011411998'); //removes HiCaste
                            msg.member.addRole('666017463837917203'); //adds eXec;
                            msg.reply('You are now eXec in the City of Glass!');
                            }
                        }
                        if(runnerBagsPointsAmount > 1999 && runnerBagsPointsAmount < 4000){
                            if(msg.member.roles.find(r => r.id === "673183370296950803")){
                                msg.reply('You are already of Corporate House status! Reach 4000 points to gain Isabel status in the City of Glass!');
                            }
                            else{
                            msg.member.addRole('673183370296950803'); //adds Corporate house
                            msg.member.removeRole('668205332983709747'); //removes Kruger
                            msg.member.removeRole('673185630184013875'); //removes Isabel
                            msg.member.removeRole('624705024664272917'); //remove MidCaste;
                            msg.member.removeRole('624705219011411998'); //removes HiCaste
                            msg.member.removeRole('666017463837917203'); //remove eXec;
                            msg.reply('You are now of Corporate House status in the City of Glass!');
                            }
                        }
                        if(runnerBagsPointsAmount > 3999 && runnerBagsPointsAmount < 8000){
                            if(msg.member.roles.find(r => r.id === "673185630184013875")){
                                msg.reply('You are already Isabel status! Reach 8000 points to gain Kruger status in the City of Glass!');
                            }
                            else{
                            msg.member.removeRole('673183370296950803'); //adds Corporate house
                            msg.member.removeRole('668205332983709747'); //removes Kruger
                            msg.member.addRole('673185630184013875'); //adds Isabel
                            msg.member.removeRole('624705024664272917'); //remove MidCaste;
                            msg.member.removeRole('624705219011411998'); //removes HiCaste
                            msg.member.removeRole('666017463837917203'); //remove eXec;
                            msg.reply('You are now Isabel status in the City of Glass!');
                            }
                        }
                        if(runnerBagsPointsAmount > 7999){
                            if(msg.member.roles.find(r => r.id === "668205332983709747")){
                                msg.reply('You are already Kruger! Get ready to get your ass kicked by Faith!');
                            }
                            else{
                            msg.member.removeRole('673183370296950803'); //removes Corporate house
                            msg.member.addRole('668205332983709747'); //adds  Kruger
                            msg.member.removeRole('673185630184013875'); //removes Isabel
                            msg.member.removeRole('624705024664272917'); //remove MidCaste;
                            msg.member.removeRole('624705219011411998'); //removes HiCaste
                            msg.member.removeRole('666017463837917203'); //remove eXec;
                            msg.reply('You are now Kruger in the City of Glass! WOW!');
                            }
                        }
                        }
                    async function pickRandomWinner(){ 
                        var winnerId = (Math.floor(Math.random() * secretArray1.length));
                        winnerName =  await client.fetchUser(secretArray1[winnerId]);
                    }
                    function sendAfterSeconds(){
                        specificChannel.send(winnerName.username);
                    }
                    if(msg.content == '!winner'){
                        if(msg.member.id === '535578716756246529'){
                        specificChannel.send('*And the winner is...*');
                        pickRandomWinner();
                        setTimeout(sendAfterSeconds, 4000);
                        }
                    else{
                        specificChannel.send('*I only listen to Plastic!*');
                    }}

if(msg.content == '!test'){
    msg.author.send("*Kuma loves you*"); //secret command ;)
}

if(msg.content == '!giveaway'){//specifically made for community giveaways, just type in !giveaway to be put on the list, then the host (me) can type..
    //..!winner to randomly choose a winner.
    if(secretArray1.includes(msg.member.id) == false){
        secretArray1.push(msg.member.id)
        var fs = require('fs');
        var strSecret1 = secretArray1.join();
        fs.writeFile(filenameSecret, strSecret1, function(err){
            if(err) {
                console.log(err)
            } else {
                console.log('File written!');
            }
        });
        msg.reply('You entered the giveaway! The winner will be decided SOON');
        }
    else{
        msg.reply('You are already on the giveaway list!');
    }
}   
    //a month ago I coded a little community event, where if a user types a specific command, they find an Electronic Part (MEC reference)..
    //..if 15 people have found it, they all get an X amount of bags as bonus.
        if(msg.content.includes('!grab') && msg.member.id != '609481282111537183'){ //this is the !grab logic, exclude the bot's ID or else the bot itself grabs the bag once its thrown.
        if(isLookingForCommand == true){
            isLookingForCommand = false;//these 2 booleans were set right when the bot threw the bag.
            canShowBag = true;
            if(pointAddition <0){
                if(leaderBoard[msg.member.user.username] > 99) {//if his points are higher than 100, he can grab the bomb
                //i did this so he wont get into the negative
                msg.reply('You grabbed the bomb! ' + pointAddition + ' points. Check the leaderboard by typing !runners');
                specificChannel.send('<:wheeze:630194575771697162>');
                tooLate = true;
                setTimeout(setTooLate,3000); //cosmetic purposes, if many people at the same time try to !grab, the people who failed grabbing will get a funny message for 3 seconds.
                }
                else{msg.reply('You carry less than 100 bags which makes you easily dodge the bomb! Phew!')
                pointAddition = 0;
            };
            }
            else{
            msg.reply('You grabbed the bag! +' + pointAddition + ' points. Check the leaderboard by typing !runners', { file: "https://i.imgur.com/EAVzTpK.png"});
            SetActivityNumber(true);
            specificChannel.fetchMessage(botMessageID).then(msg => msg.delete());
            tooLate = true;
            setTimeout(setTooLate,3000);
            if(users.some(profile => profile.id === msg.member.id) == false){
                users.push({'id':msg.member.id,'score':1});
            }
        }
            PointAdditionFunction(msg.member.id);
        }
    else {
        if(tooLate=== true){
            if(pointAddition <0){
               msg.reply('TOO SLOW?');
            specificChannel.send('<:mario_sweat:690267880230879341>');
            }
            else{
            msg.reply('TOO SLOW! <:wheeze:630194575771697162>');
            }
        }else{
            if(leaderBoard[msg.member.user.username] > 100) {//if his points are higher than 100, he can grab the bomb

               msg.reply('There is no runner bag in sight! You stumble and lose 1 bag!');
                specificChannel.send('<:rtrd:677916947643498537>');
                pointAddition = -1;
                PointAdditionFunction(msg.member.id);

            }
            else{
                msg.reply(`There is no runner bag in sight!`);
            }
                }
        }
    }
}
    })
});
function setTooLate(){
    tooLate = false;
}
client.login(auth.token); //login with the authentication token.