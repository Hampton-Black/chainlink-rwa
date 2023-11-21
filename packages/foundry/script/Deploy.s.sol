//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {RealWorldAsset} from "../contracts/RealWorldAsset.sol";
import "./DeployHelpers.s.sol";

contract DeployScript is ScaffoldETHDeploy {
    address constant POLYGON_MUMBAI_CHAINLINK_ROUTER = 0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C;

    error InvalidPrivateKey(string);

    function run() external {
        uint256 deployerPrivateKey = setupLocalhostEnv();
        if (deployerPrivateKey == 0) {
            revert InvalidPrivateKey(
                "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env or use `yarn generate` to generate a new random account"
            );
        }

        console.log("Deploying contracts with the router: ", POLYGON_MUMBAI_CHAINLINK_ROUTER);

        vm.startBroadcast(deployerPrivateKey);
        RealWorldAsset rwaContract = new RealWorldAsset(
            vm.addr(deployerPrivateKey), 
            address(POLYGON_MUMBAI_CHAINLINK_ROUTER)
        );
        console.logString(string.concat("RealWorldAsset contract deployed at: ", vm.toString(address(rwaContract))));
        vm.stopBroadcast();

        /**
         * This function generates the file containing the contracts Abi definitions.
         * These definitions are used to derive the types needed in the custom scaffold-eth hooks, for example.
         * This function should be called last.
         */
        exportDeployments();
    }

    function test() public {}
}
