// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StatusLogger
 * @dev Simple contract for logging order status changes immutably on blockchain
 * @notice This contract only logs events, no state storage for gas efficiency
 */
contract StatusLogger {
    // Event emitted when order status is logged
    event OrderStatusLogged(
        string indexed orderId,
        string status,
        uint256 timestamp,
        string description
    );

    // Owner of the contract
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Log order status to blockchain
     * @param orderId The order ID from the system
     * @param status The new status of the order
     * @param description Additional description of the status change
     */
    function logStatus(
        string memory orderId,
        string memory status,
        string memory description
    ) public {
        emit OrderStatusLogged(orderId, status, block.timestamp, description);
    }

    /**
     * @dev Batch log multiple status updates in one transaction
     * @param orderIds Array of order IDs
     * @param statuses Array of statuses
     * @param descriptions Array of descriptions
     */
    function batchLogStatus(
        string[] memory orderIds,
        string[] memory statuses,
        string[] memory descriptions
    ) public {
        require(
            orderIds.length == statuses.length && statuses.length == descriptions.length,
            "Arrays must have same length"
        );

        for (uint256 i = 0; i < orderIds.length; i++) {
            emit OrderStatusLogged(orderIds[i], statuses[i], block.timestamp, descriptions[i]);
        }
    }
}
