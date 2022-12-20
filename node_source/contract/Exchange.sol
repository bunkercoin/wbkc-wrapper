// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerifySignature {

    function verify(bytes32 _nonce,
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

    event Withdraw(bytes32 indexed _nonce, address indexed _address, uint256 indexed _amount);
    event Deposit(string indexed _addressBKC, uint256 indexed _amount);

    mapping(address => mapping(bytes32 => bool)) public nonces;
    address tokenAddress = 0x5BCda6E59262A96a599Ea938c9B679714c105Bba;

    function withdrawToken(bytes32 _nonce, address _address, uint256 _amount, bytes32 _r, bytes32 _s, uint8 _v) public {

        require(verify(_nonce,_address,_amount,_r,_s,_v,owner())==true);
        require(nonces[_address][_nonce] == false);

        IERC20(tokenAddress).transfer(_address, _amount);
        nonces[_address][_nonce] = true;
        
        emit Withdraw(_nonce, _address, _amount);
    }

    function depositToken(string calldata _addressBKC, uint256 _amount) public{
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
        emit Deposit(_addressBKC, _amount);
    }

    //ability to recover ERC20 tokens sent to this contract
    function recoverERC20(address _tokenAddress, uint256 _tokenAmount) public virtual onlyOwner {
        require(_tokenAmount>= 1 ether);
        IERC20(_tokenAddress).transfer(owner(), _tokenAmount);
    }

    // Blocking of renouncing.
    function renounceOwnership() public view override onlyOwner {
        revert();
    }

}
