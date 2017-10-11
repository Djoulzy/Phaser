
function rtrim(str, chr) {
	var rgxtrim = (!chr) ? new RegExp('\\s+$') : new RegExp(chr+'+$');
	return str.replace(rgxtrim, '');
}

function Encrypt_b64(text)
{
	var C = CryptoJS;

	var iv_bin
	var HASH_SIZE = 8
	var HEX_KEY = "d87fbb277eefe245ee384b6098637513462f5151336f345778706b462f724473"
	var HEX_IV = "046b51957f00c25929e8ccaad3bfe1a7"

	var text_bin = C.enc.Utf8.parse(text)
	var key_bin = CryptoJS.enc.Hex.parse(HEX_KEY)
	var iv_bin = CryptoJS.enc.Hex.parse(HEX_IV)

	var hash = C.MD5(text_bin).toString().substr(0, 16)
	console.log("Hash: "+hash)
	var signedText = CryptoJS.enc.Hex.parse(hash + text_bin)
	console.log("SignedText: " + signedText)

	var encrypted = C.AES.encrypt(signedText, key_bin, { iv: iv_bin, mode: C.mode.CBC, padding: C.pad.Pkcs7 }).ciphertext
	var b64_iv = C.enc.Base64.stringify(iv_bin)
	var b64_crypted = C.enc.Base64.stringify(encrypted)
	console.log("IV = " + b64_iv)
	console.log("encrypted = " + b64_crypted)

	var b64_iv_final = rtrim(b64_iv.replace("/", "_").replace("+", "-"), "=")
	var b64_crypted_final = rtrim(b64_crypted.replace("/", "_").replace("+", "-"), "=")

	console.log("Final = " + b64_iv_final + "/" + b64_crypted_final)
	return b64_iv_final + "/" + b64_crypted_final
}
