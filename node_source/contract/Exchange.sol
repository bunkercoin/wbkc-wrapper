// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



contract VerifySignature {


    function verify(uint _nonce,
        address _address,
        uint _amount,
        bytes32 _r,
        bytes32 _s,
        uint8 _v,
        address _signer
    ) public pure returns (bool) {

        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(_nonce, _address, _amount))));

        return ecrecover(ethSignedMessageHash, _v, _r, _s) == _signer;
    }
}



contract Exchange is VerifySignature, Ownable{

    mapping(address => mapping(uint256 => bool)) public nonces;

    address tokenAddress = 0x9466544Caf21FC05de2b48f6ce2F0975Ccf824ad;

    function withdrawMoney(uint256 _nonce, address _address, uint256 _amount, bytes32 _r, bytes32 _s, uint8 _v) public {

        require(verify(_nonce,_address,_amount,_r,_s,_v,owner())==true);
        require(nonces[_address][_nonce] == false);
        require(IERC20(tokenAddress).balanceOf(address(this)) >= _amount);

        nonces[_address][_nonce] = true;
        IERC20(tokenAddress).transfer(_address, _amount);
    }

    //ability to recover ERC20 tokens sent to this contract
    function recoverERC20(address _tokenAddress, uint256 _tokenAmount) public virtual onlyOwner {
        IERC20(_tokenAddress).transfer(owner(), _tokenAmount);
    }

    // Blocking of renouncing.
    function renounceOwnership() public view override onlyOwner {
        revert("renouncing is blocked");
    }

}