// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

pragma experimental ABIEncoderV2;

import "../lib/forge-std/src/Test.sol";
import "../contracts/RealWorldAsset.sol";

contract CompilationTest is Test {
    RealWorldAsset public asset;
    address private alice = vm.addr(0x1);
    address private bob = vm.addr(0x2);
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    function setUp() public {
        asset = new RealWorldAsset(alice, 60);
    }

    function test_AssetCreation() public {
        // Test asset creation
        assertNotEq(address(asset), address(0));
    }

    function test_Mint() public {
        // Need minter role first
        vm.startPrank(alice);
        asset.grantRole(MINTER_ROLE, alice);
        asset.mint(alice, 1, 1, "");
        vm.stopPrank();

        assertEq(asset.balanceOf(alice, 1), 1);
    }

    function test_RevertWhen_MintWithoutMinterRole() public {
        // Need minter role first
        vm.startPrank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, bob, MINTER_ROLE)
        );
        asset.mint(bob, 1, 1, "");
        vm.stopPrank();
    }
}
