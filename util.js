function toBn(i){
	const [a,b="0"] = i.split(".")
	return BigInt(a)*BigInt("10000000") + BigInt(b)*BigInt(Math.pow(10,7-b.length))
}


function toStr(i){
	const a = i / BigInt("10000000");
	const b = i % BigInt("10000000");
	return a+"."+b
}


module.exports = {toBn, toStr}