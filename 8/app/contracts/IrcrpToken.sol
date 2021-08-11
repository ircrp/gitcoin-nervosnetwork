pragma solidity >=0.8.0;

import "./openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract IrcrpToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("IrcrpToken", "IRCRP") {
        _mint(msg.sender, initialSupply);
    }
}
