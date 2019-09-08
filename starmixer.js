const GATHERING_TIME = 5 * 1000; // amount of time to wait to gather users

//help line
function help(){
	bot.chat.send(channel, {body: "Enter: !mix <val> xlm <arg>"});
}

let state = "idle";

// Pending transactions
// Object will be in forms { fromUsername: string, fromWallet: walletId, toWallet: walletId, toUsername: string, value: integer }
let transactions = [];


const Bot = require('keybase-bot')

const bot = new Bot()
const username = 'starmixer'
const paperkey = 'horse heart toilet enrich bunker machine spy blanket tube between bench report visual'
bot
  .init(username, paperkey, {verbose: false})
  .then(async () => {
    console.log(`Your bot is initialized. It is logged in as ${bot.myInfo().username}`)

    const message = {
      body: `Hello kbot! This is ${bot.myInfo().username} saying hello from my device ${bot.myInfo().devicename}`,
    }


    const onMessage = async message => {
       const channel = message.channel;

       let args = message.content.text.body.split(" ");
       console.log("args: ", args);

       if (args[0].toLowerCase().localeCompare("!mix") === 0) {

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

				// Valid statment
				if (state === "idle") {

					console.log("Switching to gathering state!");
					state = "gathering";

					setTimeout(transact, GATHERING_TIME); 
				}


				transactions.push({
					toWallet: toWallet,
					toUsername: targetUsername,
					fromWallet: fromWallet,
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
function transact() {
	console.log("Transaction occurring! Switching to signing state!");
	state = "signing";

	let transaction;



	// Send a message to all signers
	for (transaction of transactions) {

		let name = transaction.fromUsername + "," + bot.myInfo().username;
		console.log("Channel name is:", name);
		let channel = {
			name: name,
			public: false,
			topicType: "chat"
		};
		bot.chat.send(channel, {body:"type '!sign <signature>' to sign the transaction to "
				 + transaction.toUsername + " for " + transaction.value + " lumens!"});
	}

	console.log("Transactions occurring: ", transactions);
}
