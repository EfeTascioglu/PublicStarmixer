const GATHERING_TIMEOUT = 5 * 1000; // amount of time to wait to gather users
const SIGNING_TIMEOUT = 10 * 1000;
const c = require("./config.json");
const t = require("./transaction");
const s = require("./shuffle");


//help line
function help(){
	bot.chat.send(channel, {body: "Enter: !mix <val> xlm <arg>"});
}

let state = "idle";

// Pending transactions
// Object will be in forms { fromUsername: string, from: walletId, to: walletId, toUsername: string, value: integer }
let transactions = [];

// Signing signatures
let signatures = [];

const Bot = require('keybase-bot')

const bot = new Bot()
const username = c.botUser;
const paperkey = c.botKey;
bot
  .init(username, paperkey, {verbose: false})
  .then(async () => {
	await t.load()
    console.log(`Your bot is initialized. It is logged in as ${bot.myInfo().username}`)

    const onMessage = async message => {
       const channel = message.channel;

       let args = message.content.text.body.split(" ");
       console.log("args: ", args);


	// Handle signing logic
	if (args[0].toLowerCase().localeCompare("!sign") === 0) {

		if (state !== "signing") {
			bot.chat.send(channel, {body: "Not currently signing!"});
			return;
		}


		// TODO sign
	}

       if (args[0].toLowerCase().localeCompare("!mix") === 0) {

	if (state === "signing") {
		bot.chat.send(channel, {body: "Signing in progress! Try again later!"});
		return;
	}
	  // Valid form
	   if (args.length >= 2 ){
		let amount = parseInt(args[1]);
		let targetUsername = args[2];

		// Trim '@' off of it
		if (targetUsername.charAt(0) === '@') {
			console.log("Removing an '@'");
			targetUsername = targetUsername.substring(1);
		}

		console.log("Message received: amount is:", amount);
		console.log("                  target is:", targetUsername);

		// TODO check more validations
		if (amount >= 0 && !isNaN(amount)){

			try {
				// If lookup fails, error will be thrown
				let fromWallet = await bot.wallet.lookup(message.sender.username);
				let toWallet = await bot.wallet.lookup(targetUsername);

				// Valid statment, start waiting for timeout
				if (state === "idle") {

					console.log("Switching to gathering state!");
					state = "gathering";

					// Begin the transaction signing
					setTimeout(transact, GATHERING_TIMEOUT); 
				}


				transactions.push({
					to: toWallet,
					toUsername: targetUsername,
					from: fromWallet,
					fromUsername: message.sender.username,
					value: amount
				});
				bot.chat.send(channel, {body: "Transaction added to queue!"});

			} catch (err) {
				bot.chat.send(channel, {body: "Sorry, we couldn't find that user!"});
//				console.log("Error grabbing wallet",err);
			}

		} else {
			bot.chat.send(channel, {body: "Oh No Yo! Your number isn't valid!"});
		}

	   } else{
		bot.chat.send(channel, {body: "Enter: !mix <val> xlm <arg>"});
	   }

       } else {
           bot.chat.send(channel, {body: "Hi! Please Type: '!mix'"});
       }
    }

    bot.chat.watchAllChannelsForNewMessages(onMessage);

    })
  .catch(error => {
    console.error(error)
    bot.deinit()
  })


// Does transactions between everyone in array
async function transact() {
	console.log("Transaction occurring! Switching to signing state!");
	state = "signing";

	let transaction;
	const xdr = t.buildTransaction(s(transactions));



	// Send a message to all signers
	for (transaction of transactions) {

		let name = transaction.fromUsername + "," + bot.myInfo().username;
		console.log("Channel name is:", name);
		let channel = {
			name: name,
			public: false,
			topicType: "chat"
		};
		bot.chat.send(channel, {body:"Type `keybase wallet sign --xdr "+xdr+" --account "+transaction.from+"` to sign the transaction to "
				 + transaction.toUsername + " for " + transaction.value + " lumens! \n Then send the signature to the bot with `!sign <signature>`"});
	}

	console.log("Transactions occurring: ", transactions);

	// Add a timeout for signing
	setTimeout(resetState, SIGNING_TIMEOUT);
}


// Resets everything to original state
function resetState() {


        // Send a message to all transacts that signing timed out.
        for (transaction of transactions) {
                let name = transaction.fromUsername + "," + bot.myInfo().username;
                console.log("Channel name is:", name);
                let channel = {
                        name: name,
                        public: false,
                        topicType: "chat"
                };
                bot.chat.send(channel, {body:"Transaction signing timed out, as not everyone signed. Type '!mix' to start again!"});
        }




	transactions = [];
	signatures = [];
	state = "idle";
}

