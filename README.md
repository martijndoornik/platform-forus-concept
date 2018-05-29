# Event-driven Platform Forus Concept

This project is build as an aid to show the advantages of event-driven services API. 

## Events

Some events can have a certain sequence in which their occur. This will be noted in 
the event section. Any events that occur out of this sequence, are marked with "OOS".

### ERC20 - Transfer

This event is split into multiple messages, in sequence. 

#### requestErc20Transfer

Trigger: when a user requests a transfer from his wallet to someone else's. 

Additional data:
- to: the receiver of the transaction;
- amount: the amount that the receiver should send

#### savedErc20Transfer

Trigger: when a caching system has saved the request

#### executedErc20Transfer

Trigger: when an instance has proved that the transfer is valid and executed. Caching 
systems should now remove this from cache and all database systems can save the new data
as truth. 

#### failedErc20Transfer (OOS)

Trigger: when an instance has proved that the ERC20 transfer request is not valid or
impossible. 

Additional data: 
- message: contains the error message explaining why this system deemed this 
transaction invalid