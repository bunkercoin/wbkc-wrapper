from flask import Flask, json
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_cors import CORS  # Import the CORS extension

from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
import base64
import os
import hashlib
import time
import sqlite3
import address_utils
import random
from web3 import Web3
from eth_account.messages import encode_defunct

import threading
#threadsafe locking
lock_write = threading.Lock()
lock_withdraw = threading.Lock()

api = Flask(__name__)
CORS(api) 
limiter = Limiter(
    get_remote_address,
    app=api,
    default_limits=["100 per day", "30 per hour"]
)
cache = Cache(api,config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 60})

# Config
BKC_PRIVATE_KEY = ''
NODE_ADDRESS = ''
MATIC_PRIVATE_KEY = ''
TAX = 50 # BKC per transaction (0.02 network cost)
RPC = "http://%s:%s@127.0.0.1:14201"%("username", "password") # Change to your RPC username, password, port and ip.
w3 = Web3(Web3.HTTPProvider("https://mumbai.polygonscan.com")) # Add your HTTP Provider here

#rpc connection

def init():

	rpc_connection = AuthServiceProxy(RPC, timeout = 20)
	rpc_connection.importprivkey(BKC_PRIVATE_KEY, "node", True)

	#database tables must be created only once
	db = con.cursor()
	db.execute("CREATE TABLE IF NOT EXISTS depositAddress (matic text,bkc text,date text,message text)")
	db.execute("CREATE TABLE IF NOT EXISTS promise (matic text, value text, nonce text, date text, r text, s text, v text)")
	db.execute("CREATE INDEX IF NOT EXISTS idx_imatic ON promise (matic)")
	con.commit()

#allow multithreaded database access	
con = sqlite3.connect('database.db', check_same_thread=False)

def db_execute(command, args):
	with lock_write:
		r = con.execute(command,args)
		con.commit()
		return r
	
def derive_secret(derivation):
	deposit_secret = BKC_PRIVATE_KEY+"/"+derivation
	secret = address_utils.sha256(deposit_secret.encode('utf-8'))
	return secret

def validateMaticAddress(address):
	if not w3.is_checksum_address(address):
		raise Exception("Not a matic checksum address")
	return True
	
def to_32byte_hex(val):
	return w3.to_hex(w3.to_bytes(val).rjust(32, b'\0'))

@api.errorhandler(Exception)
def handle_invalid_usage(error):
	message = {"error":str(error)}
	return json.dumps(message)


@api.route('/getDepositAddress/<string:addressMatic>', methods=['GET'])
@cache.memoize(1200)
def getDepositAddress(addressMatic):

	#validate input
	validateMaticAddress(addressMatic)
	
	deposit_secret = derive_secret(addressMatic)
	depositAddress = address_utils.getAddress(deposit_secret)
	depositPrivate = address_utils.getWif(deposit_secret)
	message = json.dumps({"addressMatic": addressMatic, "depositAddress": depositAddress})
	rpc_connection = AuthServiceProxy(RPC, timeout = 20)
	signature = rpc_connection.signmessage(NODE_ADDRESS, message)
	
	#database
	data = (addressMatic,depositAddress,int(time.time()),signature)
	db_execute("INSERT INTO depositAddress VALUES (?,?,?,?)",data)
	
	rpc_connection.importprivkey(depositPrivate, addressMatic, False)
	
	result = {"message":message, "signature":signature, "node":NODE_ADDRESS}
	
	return json.dumps(result)
	
@api.route('/getBalance/<string:addressMatic>', methods=['GET'])
def getBalance(addressMatic):
	
	#validate input
	validateMaticAddress(addressMatic)
	
	rpc_connection = AuthServiceProxy(RPC, timeout = 20)
	total = rpc_connection.getbalance(addressMatic)
	
	return json.dumps(total)
	
	
@api.route('/getBalanceUnconfirmed/<string:addressMatic>', methods=['GET'])
def getBalanceUnconfirmed(addressMatic):
	
	#validate input
	validateMaticAddress(addressMatic)
	
	rpc_connection = AuthServiceProxy(RPC, timeout = 20)
	total = rpc_connection.getbalance(addressMatic, 1)
	
	return json.dumps(total)


@api.route('/getPromises/<string:addressMatic>', methods=['GET'])
@cache.memoize(120)
def getPromises(addressMatic):
	#validate input
	validateMaticAddress(addressMatic)
	
	rows = db_execute("SELECT * FROM promise WHERE matic=?", [addressMatic]).fetchall()	
	return json.dumps(rows)
	

@api.route('/emitwBKC/<string:addressMatic>', methods=['GET'])
def emitwBKC(addressMatic): 

	#validate input
	validateMaticAddress(addressMatic)
	
	#generate a nonce to avoid respending
	nonce = str(time.time()+random.random()) + MATIC_PRIVATE_KEY + addressMatic
	nonce = w3.keccak(text = nonce)
	
	with lock_withdraw:
		rpc_connection = AuthServiceProxy(RPC, timeout = 20)
		coins = rpc_connection.getbalance(addressMatic)
	
		#check the user has at least 10kBKC to withdraw but less than 5M
		if coins<10:
			raise Exception("Not enough deposit")
		
		if coins>5000000:
			raise Exception("Too much deposit! must manually wrap")
		
		# Tax BKC fixed fee
		coins = float(coins)-TAX
		coinsWei = w3.to_wei(coins, 'ether')
		hash = w3.solidity_keccak(['bytes32', 'address', 'uint256'], [nonce, addressMatic, coinsWei])
		message = encode_defunct(hexstr=hash.hex())
		signed_message =  w3.eth.account.sign_message(message, private_key=MATIC_PRIVATE_KEY)
	
		#uppon emission, transfer the funds to the "main" wallet
		rpc_connection.sendfrom(addressMatic, NODE_ADDRESS, coins+TAX-0.02)
	
	#log in the DB
	data = (addressMatic,str(coinsWei),nonce.hex(),int(time.time()),to_32byte_hex(signed_message.r),to_32byte_hex(signed_message.s), signed_message.v)
	db_execute("INSERT INTO promise VALUES (?,?,?,?,?,?,?)",data)

	#give out the signed promisse
	signature = {"nonce": nonce.hex(), "address":addressMatic, "coins": coinsWei, "r":to_32byte_hex(signed_message.r), "s":to_32byte_hex(signed_message.s),"v":signed_message.v}
	#return r s v to the client
	return json.dumps(signature)



if __name__ == '__main__':
	init()	
	api.run(host="0.0.0.0", port=5000, threaded=True, debug=True)
