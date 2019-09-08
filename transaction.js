const StellarSdk = require('stellar-sdk');
const c = require("./config.json");

const botKey = c.stellarKey

// Derive Keypair object and public key (that starts with a G) from the secret
const sourceKeypair = StellarSdk.Keypair.fromSecret(botKey);
const sourcePublicKey = sourceKeypair.publicKey();

// Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
// To use the live network, set the hostname to 'horizon.stellar.org'
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// Uncomment the following line to build transactions for the live network. Be
// sure to also change the horizon hostname.
// StellarSdk.Network.usePublicNetwork();
StellarSdk.Network.useTestNetwork();

let account, fee;

async function load(){
  // Transactions require a valid sequence number that is specific to this account.
  // We can fetch the current sequence number for the source account from Horizon.
  account = await server.loadAccount(sourcePublicKey);


  // Right now, there's one function that fetches the base fee.
  // In the future, we'll have functions that are smarter about suggesting fees,
  // e.g.: `fetchCheapFee`, `fetchAverageFee`, `fetchPriorityFee`, etc.
  fee = await server.fetchBaseFee();
}

function buildTransaction(shuffle) {
  const transaction = shuffle.reduce((acc,val)=>acc.addOperation(StellarSdk.Operation.payment({
      destination: val.to,
      // The term native asset refers to lumens
      asset: StellarSdk.Asset.native(),
      // Specify 350.1234567 lumens. Lumens are divisible to seven digits past
      // the decimal. They are represented in JS Stellar SDK in string format
      // to avoid errors from the use of the JavaScript Number data structure.
      amount: val.value+"",
      source: val.from
    })), new StellarSdk.TransactionBuilder(account, { fee })).setTimeout(99999).build()
   transaction.sign(sourceKeypair)
  // Let's see the XDR (encoded in base64) of the transaction we just built
  return transaction.toEnvelope().toXDR('base64');
}

async function signTransaction(xdr,sigs){
	const transaction =  new StellarSdk.Transaction(xdr)
	sigs.forEach((sig)=>transaction.addSignature(sig[0],sig[1]));
	console.log(transaction.toEnvelope().toXDR('base64'))
	return server.submitTransaction(transaction);
}

function makeSig(xdr,secret){
	const transaction = new StellarSdk.Transaction(xdr);
	const keypair = StellarSdk.Keypair.fromSecret(secret);
	return transaction.getKeypairSignature(keypair);
}

module.exports={load,buildTransaction, signTransaction, makeSig}