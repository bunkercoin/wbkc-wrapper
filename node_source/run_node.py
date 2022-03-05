from flask import Flask, json
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
import base64
import os
import hashlib
import time
import sqlite3
import address_utils

from web3.auto import w3
from eth_account.messages import encode_defunct



api = Flask(__name__)
limiter = Limiter(
    api,
    key_func=get_remote_address,
    default_limits=["200 per day", "60 per hour"]
)

#my node details
BKC_PRIVATE_KEY = ''
NODE_ADDRESS = ''
NODE_ID = 0
NREQUIRED = 1 #for funds unlocking
MATIC_PRIVATE_KEY = ''

#all the authority node address
PEER_NODES = ["BTdSU3Dh5hm17EtDfxPCd9wdzFMqayfNzk"]

#rpc connection
rpc_connection = AuthServiceProxy("http://%s:%s@127.0.0.1:9999"%("user", "pass"))
rpc_connection.importprivkey(BKC_PRIVATE_KEY, "node", True)


#database tables must be created only once
#con = sqlite3.connect('database.db')
#db = con.cursor()
#db.execute("CREATE TABLE depositAddress (matic text,bkc text,date text,message text)")
#con.commit()
#con.close()


def derive_key(derivation):
	deposit_secret = BKC_PRIVATE_KEY+derivation
	derivation = address_utils.sha256(deposit_secret.encode('utf-8'))
	publicKey = address_utils.getPublicKey(derivation)
	return publicKey.hex()

def validateMaticAddress(address):
	if not w3.isChecksumAddress(address):
		raise Exception("Not a matic checksum address")
	return true

# requests a node for it's claim of deposit
@api.route('/getDepositAddress/<string:addressMatic>', methods=['GET'])
def deposit_address(addressMatic):

	#validate input
	validateMaticAddress(addressMatic)
	
	publicKeyAddress = derive_key(addressMatic)
	message = json.dumps({"addressMatic": addressMatic, "depositAddress": publicKeyAddress})
	signature = rpc_connection.signmessage(NODE_ADDRESS, message)
	
	result = {"message":message, "signature":signature}
	
	return base64.b64encode(json.dumps(result).encode('utf-8'))


#receives a list of claims and validates it.
#returns the generated deposit address and watches it.
@api.route('/verifyDepositAddress/<string:signedDerivations>', methods=['GET'])
def verify_address(signedDerivations):
	messages_decoded = base64.b64decode(signedDerivations)
	messages = json.loads(messages_decoded)
	public_keys = []
	claim = messages[PEER_NODES[0]]["message"]
	
	#check if there exists a signed claim from every authority node
	for node in PEER_NODES:
		m = messages[node]
		valid = rpc_connection.verifymessage(node, m["signature"], m["message"])
		if not valid or m["message"] != claim:
			raise Exception('Signatures are not valid')
		message_content = json.loads(m["message"])
		public_keys.append(message_content["depositAddress"])
	
	multisig_deposit = rpc_connection.addmultisigaddress(NREQUIRED, public_keys)
	
	
	matic = json.loads(claim)["addressMatic"]
	#validate input
	validateMaticAddress(matic)
	
	# Add the data to the local db
	con = sqlite3.connect('database.db')
	db = con.cursor()
	data = (matic,multisig_deposit,int(time.time()),signedDerivations)
	db.execute("INSERT INTO depositAddress VALUES (?,?,?,?)",data)
	con.commit()
	con.close()
	
	return json.dumps(data)

@api.route('/emitwBKC/<string:maticAddress>', methods=['GET'])
def emit_wBKC(maticAddress):

	#validate input
	validateMaticAddress(maticAddress)
	
	# Check if we have generated a deposit address
	con = sqlite3.connect('database.db')
	db = con.cursor()
	
	db.execute("SELECT * FROM depositAddress WHERE matic=?",(maticAddress,))
	record = db.fetchall()
	
	con.commit()
	con.close()
	
	#we expect only 1 record
	if len(record) != 1:
		raise Exception("No record for address")
	
	#TODO:
	#check if a deposit is made
	#emit for the specific depost
	coins = 1000
	# signed data respresents: matic address + how many coins
	data = record[0][0] + str(coins)
	message = encode_defunct(text=data)
	signed_message =  w3.eth.account.sign_message(message, private_key=MATIC_PRIVATE_KEY)
	
	#return r s v to the client
	return signed_message.signature.hex()



if __name__ == '__main__':
	api.run()
