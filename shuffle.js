const u = require("./util")

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Given an array of integer wallet balances, this function returns an array of transactions that can be used
 * to create a new array of shuffled wallets (i.e. the new balances will be from a variety of different wallets)
 */
function shuffleWallets(array) {

	// Deep copy the array
	let originalArray = JSON.parse(JSON.stringify(array));
	let shuffledArray = JSON.parse(JSON.stringify(array));
	originalArray.forEach(x=>{x.value=u.toBn(x.value)})
	shuffledArray.forEach(x=>{x.value=u.toBn(x.value)})

	// Shuffle the array in place
	shuffle(shuffledArray);

	let links = [];
	let j = 0;

	// Loop through each new wallet and add money to it from the old wallets
	for (var i = 0; i < shuffledArray.length; i++) {
		// How much the i-th wallet should have at the end
		let targetTotal = shuffledArray[i].value;

		// Loop through the original array and add those values to the link list
		while (j < originalArray.length && targetTotal > 0) {

			// Check that the current wallet being transferred out of isn't empty
			if (originalArray[j].value <= 0) { 
				j ++;
				continue; 
			}

			// The amount to try to transfer out of the original wallet into the shuffled wallet
			var transferAmount = targetTotal < originalArray[j].value? targetTotal:  originalArray[j].value

			// Transfer the money out
			originalArray[j].value -= transferAmount;
			targetTotal -= transferAmount;

			let link = {
				from: originalArray[j].from,
				to: shuffledArray[i].to,
				value: u.toStr(transferAmount)
			}
			
			links.push(link);
		}
	}
	
	
	//console.log("Links: ", links);
	return links;
}
module.exports = shuffleWallets
//shuffleWallets([{src:1,dest:2, amnt:1},{src:3,dest:4, amnt:2}, {src:5,dest:6, amnt:3}]);