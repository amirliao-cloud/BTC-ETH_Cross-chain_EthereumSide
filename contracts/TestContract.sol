pragma solidity ^0.5.0;

contract MyContract {
    struct MyStruct {
        uint256 _value;
        string myString;
    }
    mapping (uint256 => MyStruct) MyStructs;


    function newStruct() public {
        uint256 ID = 1;
        MyStructs[ID] = MyStruct(
            123456,
            "Hello!%"
        );
    }

    function getStruct(uint256 ID) public view returns(MyStruct) {
        return MyStructs[ID];
    }


}