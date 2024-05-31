// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Suave} from "suave-std/suavelib/Suave.sol";

contract Counter {
    uint256 public number;
    event NumberSet(uint256 newNumber);

    constructor() {
        number = 1;
    }

    modifier confidential() {
        require(Suave.isConfidential(), "must be called confidentially");
        _;
    }

    function onSetNumber(uint256 newNum) public {
        number = newNum;
        emit NumberSet(newNum);
    }

    function setNumber()
        public
        confidential
        returns (bytes memory suaveCalldata)
    {
        uint256 newNumber = abi.decode(Suave.confidentialInputs(), (uint256));
        suaveCalldata = abi.encodeWithSelector(
            this.onSetNumber.selector,
            newNumber
        );
    }
}
