/**
 * Code used to generate these fixtures 
    
    const passphrase = "educate attitude rely combine treat balcony west reopen coil west grab depth";

    const transactions: ITransactionData[] = [13,17,15,16,12,18,14].map(amount=>{
        return TransactionFactory .transfer("DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",amount * 1e8)
                                    .withPassphrase(passphrase)
                                    .create(1)[0];
    })

    const optionsDefault = {
        timestamp: 16591704,
        previousBlock: {
            id: "3112633353705641986",
            idHex: "12605317082329008056",
            height: 1760000,
        },
        reward: new Bignum(200000000),
    };

    const block = new Delegate(passphrase, devnet.network).forge(transactions,optionsDefault);
    const serialized = Block.serialize(block.toJson()).toString("hex")

    const fs = require('fs');
    fs.writeFileSync("./block.json", JSON.stringify({serialized,b:block}));
    
 *
 */

export const dummyBlock = {
    id: "8478329431718758576",
    version: 0,
    height: 1760001,
    timestamp: 16591704,
    previousBlock: "3112633353705641986",
    numberOfTransactions: 7,
    totalAmount: "10500000000",
    totalFee: "70000000",
    reward: "200000000",
    payloadLength: 224,
    payloadHash: "2abda21ec59f1405bebdf8c3f02d0c1776dcbce05e457fe353ea28fb4bf75faf",
    generatorPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
    blockSignature:
        "30440220171b48497fbbd9bab4cf3291eaf6b1469d8cc7c202ad39179420748258b19fae02203b9555d264fa0e331afc85f5de3d0aee6cbab9168f562becb8635e931f3e8e2c",
    previousBlockHex: "2b324b8b33a85802",
    idHex: "75a913b2b25608b0",
    transactions: [
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 77337359,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1600000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "30440220308109f5f95106deb569cbeb3ae784df0632fd5884b1f5d40256dc24abfd5eb702203322165ec2ce47616eff392ad411f2e1e3f1874382423c2401d1ddfb0a2b85ec",
            id: "10d0069fafcb7bb24c71e8bae498d5ab173a7b8b5e6a471e47b7825a29180630",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 0,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 77337359,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1700000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "304402204efac868aaf7892567d5eab53940fa6c28a0c3cb0b1f7e9cd4557d62c77ceb7c02203676f7e14a7fa7b43f99ee107e8442f60300fc73546ad53c4ebbeb6e3141f96e",
            id: "1bbec0d9a62718d1eb00d1a8186a5cbbdc42ed69734cfa2d526e7175223de88e",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 1,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 77337359,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1800000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3044022061799cdcf92fcb2492cf5b879d1dd33702adbb40b8e80c25dfc767aa212ba08d0220429cb725d494b20564b2a74c131ce1a88e87fef00c90b1bc63ec512f92280cdc",
            id: "2430837af6c223b9103af9375a94f18da2017d9ee669ea37105f5432822be11c",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 2,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 16849305,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1300000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3044022063d145b486f3686e6af404ecdd8239b3fd763bd29a7222d7bdc17a0addec7a9b0220553e3c6a846d4e05f34850f8c3ccbb12c7c7b9ef4f136d2c261072a23ae3addd",
            id: "995198dd5f6f26b011c42450c4ab8b79cb30bbf5990d2b5b1fc2acd2999bd67c",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 3,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 77337359,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1500000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3045022100b5129f2135a799165c141f96cde6302d65666c3be2139645e91af93636e685f00220253a6a96bb632a14f9b1b7a5c18b8be027951bc7181197c77dd893716c84b76d",
            id: "c57b962b2785e2812971cc2531d0b0aa10f40d5603a03f99cec6c907fee98104",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 4,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 77337359,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1400000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3045022100fc88c93f681aa0d35915ef339e51a79909cfc2dbabc6881b285c68b44d5e7b160220336d9e35139b9e0e9ec8ec3c918b9319d79efbf2323c2f8be97de25d01ad3439",
            id: "fbac44fe41e0bb72f361008d481a68e844a78f985d40a30554579a2d1b31f915",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 5,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 77337359,
            senderPublicKey: "02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca",
            fee: "10000000",
            amount: "1200000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "304402201171a91867cb2d7f2a206e3dae2a994fee9ad198a71e710a6bb138c37756372002202ece0ff93282bc238b83224d32cf3dae4a3a40a84abbbdf84d27bd12648d1411",
            id: "fbf6e9d6abe122c93ae775dafbcc149e09f0c0d248f5168f0e14c619d2f04abc",
            blockId: "8478329431718758576",
            vendorField: "Test Transaction 1",
            sequence: 6,
        },
    ],
};

export const dummyBlock2 = {
    data: dummyBlock,
    serialized:
        "00000000582bfd0001db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e00000002abda21ec59f1405bebdf8c3f02d0c1776dcbce05e457fe353ea28fb4bf75faf02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca30440220171b48497fbbd9bab4cf3291eaf6b1469d8cc7c202ad39179420748258b19fae02203b9555d264fa0e331afc85f5de3d0aee6cbab9168f562becb8635e931f3e8e2c",
    serializedFull:
        "00000000582bfd0001db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e00000002abda21ec59f1405bebdf8c3f02d0c1776dcbce05e457fe353ea28fb4bf75faf02c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca30440220171b48497fbbd9bab4cf3291eaf6b1469d8cc7c202ad39179420748258b19fae02203b9555d264fa0e331afc85f5de3d0aee6cbab9168f562becb8635e931f3e8e2cab000000ab000000ab000000ab000000ac000000ac000000ab000000ff011e000f139c0402c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e203100105e5f00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530440220308109f5f95106deb569cbeb3ae784df0632fd5884b1f5d40256dc24abfd5eb702203322165ec2ce47616eff392ad411f2e1e3f1874382423c2401d1ddfb0a2b85ecff011e000f139c0402c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e203100f1536500000000000000001e46550551e12d2531ea9d2968696b75f68ae7f295304402204efac868aaf7892567d5eab53940fa6c28a0c3cb0b1f7e9cd4557d62c77ceb7c02203676f7e14a7fa7b43f99ee107e8442f60300fc73546ad53c4ebbeb6e3141f96eff011e000f139c0402c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e203100d2496b00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953044022061799cdcf92fcb2492cf5b879d1dd33702adbb40b8e80c25dfc767aa212ba08d0220429cb725d494b20564b2a74c131ce1a88e87fef00c90b1bc63ec512f92280cdcff011e009919010102c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e2031006d7c4d00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953044022063d145b486f3686e6af404ecdd8239b3fd763bd29a7222d7bdc17a0addec7a9b0220553e3c6a846d4e05f34850f8c3ccbb12c7c7b9ef4f136d2c261072a23ae3adddff011e000f139c0402c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e2031002f685900000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100b5129f2135a799165c141f96cde6302d65666c3be2139645e91af93636e685f00220253a6a96bb632a14f9b1b7a5c18b8be027951bc7181197c77dd893716c84b76dff011e000f139c0402c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e2031004e725300000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100fc88c93f681aa0d35915ef339e51a79909cfc2dbabc6881b285c68b44d5e7b160220336d9e35139b9e0e9ec8ec3c918b9319d79efbf2323c2f8be97de25d01ad3439ff011e000f139c0402c39e352d0f3c4ea19842a5bca3114b4247cd56da72157963a5873ecfcd824aca80969800000000001254657374205472616e73616374696f6e2031008c864700000000000000001e46550551e12d2531ea9d2968696b75f68ae7f295304402201171a91867cb2d7f2a206e3dae2a994fee9ad198a71e710a6bb138c37756372002202ece0ff93282bc238b83224d32cf3dae4a3a40a84abbbdf84d27bd12648d1411",
};

export const dummyBlock3 = {
    id: "7242383292164246617",
    version: 0,
    timestamp: 46583338,
    height: 3,
    reward: "0",
    previousBlock: "17882607875259085966",
    numberOfTransactions: 0,
    totalAmount: "0",
    totalFee: "0",
    payloadLength: 0,
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    generatorPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
    blockSignature:
        "304402204087bb1d2c82b9178b02b9b3f285de260cdf0778643064fe6c7aef27321d49520220594c57009c1fca543350126d277c6adeb674c00685a464c3e4bf0d634dc37e39",
    createdAt: "2018-09-11T16:48:58.431Z",
};
