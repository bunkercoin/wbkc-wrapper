# Will get the balance of a given address
#
# Copyright (c) 2021 The Bunkercoin Developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php. 

from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
import logging

# Set up logging
logging.basicConfig()
logging.getLogger("BitcoinRPC").setLevel(logging.DEBUG)

# rpc_user and rpc_password are in the bunkercoin.conf file
rpc_connection = AuthServiceProxy("http://%s:%s@127.0.0.1:22225"%("bunkercoinrpc", "ixkc8skwy1bUkxxF8R9oUG3gPq9Q6x9pnPtzMfCYaPq"))
balance = rpc_connection.getbalance()
print(rpc_connection.getbalance(balance))

