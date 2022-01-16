from flask import Flask, json


from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
import base64

import os
import hashlib
import address_utils

api = Flask(__name__)

#my node details
secret = 'QUpT6iQkuPi64bqSG2VafNz3Wkaz39dnSkpKytabuNrgm4gbBvVn'
node_address = 'BTdSU3Dh5hm17EtDfxPCd9wdzFMqayfNzk'
nodeId = 0
nrequired = 1 #for funds unlocking


#all the authority node address
peer_nodes = ["BTdSU3Dh5hm17EtDfxPCd9wdzFMqayfNzk"]

#rpc connection
rpc_connection = AuthServiceProxy("http://%s:%s@127.0.0.1:9999"%("user", "pass"))
rpc_connection.importprivkey(secret, "node", True)


def derive_key(derivation):
	deposit_secret = secret+derivation
	derivation = address_utils.sha256(deposit_secret.encode('utf-8'))
	publicKey = address_utils.getPublicKey(derivation)
	return publicKey.hex()



# requests a node for it's claim of deposit
@api.route('/getDepositAddress/<string:addressMatic>', methods=['GET'])
def deposit_address(addressMatic):

	publicKeyAddress = derive_key(addressMatic)
	message = json.dumps({"addressMatic": addressMatic, "depositAddress": publicKeyAddress})
	signature = rpc_connection.signmessage(node_address, message)
	
	result = {"message":message, "signature":signature}
	
	return base64.b64encode(json.dumps(result).encode('utf-8'))


#receives a list of claims and validates it.
#returns the generated deposit address and watches it.
@api.route('/verifyDepositAddress/<string:signedDerivations>', methods=['GET'])
def verify_address(signedDerivations):
	messages = base64.b64decode(signedDerivations)
	messages = json.loads(messages)
	public_keys = []
	claim = messages[peer_nodes[0]]["message"]
	
	#check if there exists a signed claim from every authority node
	for node in peer_nodes:
		m = messages[node]
		valid = rpc_connection.verifymessage(node, m["signature"], m["message"])
		if not valid or m["message"] != claim:
			raise Exception('Signatures are not valid')
		message_content = json.loads(m["message"])
		public_keys.append(message_content["depositAddress"])
		
	multisig_deposit = rpc_connection.addmultisigaddress(nrequired, public_keys)
	return json.dumps(multisig_deposit)



if __name__ == '__main__':
	api.run()