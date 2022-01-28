from flask import Flask, json
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache

from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
import base64
import os
import hashlib
import time
import sqlite3
import address_utils
import random
from web3.auto import w3
from eth_account.messages import encode_defunct

import threading
#threadsafe locking
lock = threading.Lock()

api = Flask(__name__)
limiter = Limiter(
    api,
    key_func=get_remote_address,
    default_limits=["100 per day", "30 per hour"]
)
cache = Cache(api,config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 60})

#my node details
BKC_PRIVATE_KEY = 'QUpT6iQkuPi64bqSG2VafNz3Wkaz39dnSkpKytabuNrgm4gbBvVn'
NODE_ADDRESS = 'BTdSU3Dh5hm17EtDfxPCd9wdzFMqayfNzk'

MATIC_PRIVATE_KEY = '4d9e599423f0a37115c35f1dc4b749a4754545e4172d3901260a484512eee4d6'

TAX = 1 # BKC per transaction (0.98 tax, 0.02 network cost)

RPC = "http://%s:%s@127.0.0.1:9999"%("user", "pass")


#rpc connection

def init():

	rpc_connection = AuthServiceProxy(RPC, timeout = 20)
	rpc_connection.importprivkey(BKC_PRIVATE_KEY, "node", True)

	#database tables must be created only once
	con = sqlite3.connect('database.db')
	db = con.cursor()
	db.execute("CREATE TABLE depositAddress (matic text,bkc text,date text,message text)")
	db.execute("CREATE TABLE promise (matic text, value text, nonce text, date text, sig text)")
	con.commit()
	con.close()

	
def db_execute(command, args):

	con = sqlite3.connect('database.db')
	db = con.cursor()
	db.execute(command,args)
	con.commit()
	con.close()
	
	
def derive_secret(derivation):
	deposit_secret = BKC_PRIVATE_KEY+"/"+derivation
	secret = address_utils.sha256(deposit_secret.encode('utf-8'))
	return secret

def validateMaticAddress(address):
	if not w3.isChecksumAddress(address):
		raise Exception("Not a matic checksum address")
	return True
	
def to_32byte_hex(val):
	return w3.toHex(w3.toBytes(val).rjust(32, b'\0'))

@api.errorhandler(Exception)
def handle_invalid_usage(error):
	message = {"error":str(error)}
	return json.dumps(message)


@api.route('/getDepositAddress/<string:addressMatic>', methods=['GET'])
@cache.memoize(600)
def deposit_address(addressMatic):

	#validate input
	validateMaticAddress(addressMatic)

	rpc_connection = AuthServiceProxy(RPC, timeout = 20)
	
	deposit_secret = derive_secret(addressMatic)
	depositAddress = address_utils.getAddress(deposit_secret)
	depositPrivate = address_utils.getWif(deposit_secret)
	message = json.dumps({"addressMatic": addressMatic, "depositAddress": depositAddress})
	with lock:
		signature = rpc_connection.signmessage(NODE_ADDRESS, message)
	
		#database
		data = (addressMatic,depositAddress,int(time.time()),signature)
		db_execute("INSERT OR IGNORE INTO depositAddress VALUES (?,?,?,?)",data)
		rpc_connection.importprivkey(depositPrivate, addressMatic)
	
	
	result = {"message":message, "signature":signature, "node":NODE_ADDRESS}
	
	return json.dumps(result)
	
@api.route('/getBalance/<string:addressMatic>', methods=['GET'])
@cache.memoize(60)	
def getBalance(addressMatic):
	
	#validate input
	validateMaticAddress(addressMatic)
	
	with lock:
		rpc_connection = AuthServiceProxy(RPC, timeout = 20)
		total = rpc_connection.getbalance(addressMatic, 60)
	
	return json.dumps(total)
	

@api.route('/emitwBKC/<string:addressMatic>', methods=['GET'])
def emit_wBKC(addressMatic): 

	#validate input
	validateMaticAddress(addressMatic)
	
	#generate a nonce to avoid respending
	nonce = w3.sha3(text = str(time.time()+random.random())+MATIC_PRIVATE_KEY).hex()
	
	with lock:
		rpc_connection = AuthServiceProxy(RPC, timeout = 20)
		coins = rpc_connection.getbalance(addressMatic, 60)
	
		#check the user has at least 10kBKC to withdraw but less than 5M
		if coins<10000:
			raise Exception("Not enough deposit")
		
		if coins>5000000:
			raise Exception("Too much deposit! must manually wrap")
		
		# Tax BKC fixed fee
		coins = float(coins)-TAX
	
		data = nonce + addressMatic + str(coins)
		message = encode_defunct(text=data)
		signed_message =  w3.eth.account.sign_message(message, private_key=MATIC_PRIVATE_KEY)
	
		#uppon emission, transfer the funds to the "main" wallet
		rpc_connection.sendfrom(addressMatic, NODE_ADDRESS, coins+TAX-0.02)
	
		#log in the DB
		data = (addressMatic,coins,nonce,int(time.time()),signed_message.signature.hex())
		db_execute("INSERT INTO promise VALUES (?,?,?,?,?)",data)

	
	#give out the signed promisse
	signature = {"nonce": nonce, "address":addressMatic, "coins": coins, "r":to_32byte_hex(signed_message.r), "s":to_32byte_hex(signed_message.s),"v":signed_message.v}
	#return r s v to the client
	return json.dumps(signature)



if __name__ == '__main__':
	init()	
	api.run(port=5000, threaded=True)