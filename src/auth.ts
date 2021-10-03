import {BinaryLike, BinaryToTextEncoding, createHmac,randomBytes} from 'crypto';

const preFix = "VERACODE-HMAC-SHA-256";
const verStr = "vcode_request_version_1";
const alg = 'sha256';

const host = "api.veracode.com";

const hmac256 = (data:BinaryLike, key: BinaryLike, format?: BinaryToTextEncoding ) => {
	var hash = createHmac(alg, key).update(data);
	// no format = Buffer / byte array
    if (format) {
	    return hash.digest(format);
    } else {
        return hash.digest();
    }
}

const getByteArray = (hex: string) => {
	var bytes = [];

	for(var i = 0; i < hex.length-1; i+=2){
	    bytes.push(parseInt(hex.substr(i, 2), 16));
	}

	// signed 8-bit integer array (byte array)
	return Int8Array.from(bytes);
}

export const getHost = () => {
	return host;
}

export const generateHeader = (url:string, method: 'GET'|'POST'| 'PUT' ,id:string,key:string) => {

	var data: string = `id=${id}&host=${host}&url=${url}&method=${method}`;
	var timestamp: string = (new Date().getTime()).toString();
	var nonce: string = randomBytes(16).toString("hex");

	// calculate signature
	var hashedNonce = hmac256(getByteArray(nonce), getByteArray(key));
	var hashedTimestamp = hmac256(timestamp, hashedNonce);
	var hashedVerStr = hmac256(verStr, hashedTimestamp);
	var signature = hmac256(data, hashedVerStr, 'hex');

	return `${preFix} id=${id},ts=${timestamp},nonce=${nonce},sig=${signature}`;
}
