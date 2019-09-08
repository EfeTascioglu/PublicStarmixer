const c = require("./config.json");
const t = require("./transaction");
const s = require("./shuffle");

const GATHERING_TIME = 5 * 1000; // amount of time to wait to gather users

//help line
function help() {
    bot.chat.send(channel, {
        body: "Enter: !mix <val> xlm <arg>"
    });
}

let state = "idle";

// Pending transactions
// Object will be in forms { fromUsername: string, from: walletId, to: walletId, toUsername: string, value: integer }
let transactions = [];

// Signing signatures
let signatures = [];

let xdr = null;

const Bot = require('keybase-bot')

const bot = new Bot()
const username = c.botUser;
const paperkey = c.botKey;
bot
    .init(username, paperkey, {
        verbose: false
    })
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
                    bot.chat.send(channel, {
                        body: "Not currently signing!"
                    });
                    return;
                }

                signatures.push(args[1])
                if (signatures.length === transactions.length) {
					console.log(signatures)
                    const res = await t.signTransaction(xdr, signatures)
                    // Send a message to all signers
                    for (transaction of transactions) {

                        let name = transaction.fromUsername + "," + bot.myInfo().username;
                        console.log("Channel name is:", name);
                        let channel = {
                            name: name,
                            public: false,
                            topicType: "chat"
                        };
                        bot.chat.send(channel, {
                            body: "Success! Transaction ID: " + res.hash
                        });
                    }

                    transactions = []
                    signatures = []
                    state = "idle"
                    xdr = null
                }
            } else if (args[0].toLowerCase().localeCompare("!mix") === 0) {

                if (state === "signing") {
                    bot.chat.send(channel, {
                        body: "Signing in progress! Try again later!"
                    });
                    return;
                }
                // Valid form
                if (args.length >= 2) {
                    let amount = args[1].replace("xlm", "");
                    let targetUsername = args[2];

                    // Trim '@' off of it
                    if (targetUsername.charAt(0) === '@') {
                        console.log("Removing an '@'");
                        targetUsername = targetUsername.substring(1);
                    }

                    console.log("Message received: amount is:", amount);
                    console.log("                  target is:", targetUsername);

                    // TODO check more validations
                    if (parseFloat(amount) >= 0 && !isNaN(parseFloat(amount))) {

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
                                to: toWallet.accountId,
                                toUsername: targetUsername,
                                from: fromWallet.accountId,
                                fromUsername: message.sender.username,
                                value: amount
                            });
                            bot.chat.send(channel, {
                                body: "Transaction added to queue!"
                            });

                        } catch (err) {
                            bot.chat.send(channel, {
                                body: "Sorry, we couldn't find that user!"
                            });
                            //				console.log("Error grabbing wallet",err);
                        }

                    } else {
                        bot.chat.send(channel, {
                            body: "Oh No Yo! Your number isn't valid!"
                        });
                    }

                } else {
                    bot.chat.send(channel, {
                        body: "Enter: !mix <amount of lumens> <user to send to>"
                    });
                }

            } else {
                bot.chat.send(channel, {
                    body: "Hi! Please Type: '!mix'"
                });
            }
        }

        bot.chat.watchAllChannelsForNewMessages(m=>onMessage(m).catch(console.error));

    })
    .catch(error => {
        console.error(error)
        bot.deinit()
    })


// Does transactions between everyone in array
function transact() {
    try {
        console.log("Transaction occurring! Switching to signing state!");
        state = "signing";

        let transaction;
        xdr = t.buildTransaction(s(transactions));



        // Send a message to all signers
        for (transaction of transactions) {

            let name = transaction.fromUsername + "," + bot.myInfo().username;
            console.log("Channel name is:", name);
            let channel = {
                name: name,
                public: false,
                topicType: "chat"
            };
            bot.chat.send(channel, {
                body: "Type `keybase wallet sign --xdr " + xdr + " --account " + transaction.from + "` to sign the transaction to " +
                    transaction.toUsername + " for " + transaction.value + " lumens! \n Then send the signature to the bot with `!sign <signature>`"
            });
        }

        console.log("Transactions occurring: ", transactions);
    } catch (e) {
        console.log(e);
    }

}
