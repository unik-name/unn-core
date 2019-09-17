/**
 *  Code used to generate these fixtures
 *
 *  const passphrase = "prevent tone flag rubber mad parade record enlist enable charge mouse debate";
 *
 *  const transactions: ITransactionData[] = [13,17,15,16,12,18,14].map(amount=>{
 *     return TransactionFactory .transfer("DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",amount * 1e8)
 *                                  .withPassphrase(passphrase)
 *                                  .create(1)[0];
 *   })
 *
 *  const optionsDefault = {
 *      timestamp: 13660,
 *      previousBlock: {
 *          id: "3112633353705641986",
 *          idHex: "12605317082329008056",
 *          height: 1760000,
 *      },
 *      reward: new Bignum(200000000),
 *  };
 *
 *  const block = new Delegate(passphrase, devnet.network).forge(transactions,optionsDefault);
 *  const serialized = Block.serialize(block.toJson()).toString("hex")
 *
 *  const fs = require('fs');
 *  fs.writeFileSync("./block.json", JSON.stringify({serialized,b:block}));
 *
 */

export const dummyBlock = {
    id: "16529176865397370458",
    version: 0,
    height: 1760001,
    timestamp: 13660,
    previousBlock: "3112633353705641986",
    numberOfTransactions: 7,
    totalAmount: "10500000000",
    totalFee: "70000000",
    reward: "200000000",
    payloadLength: 224,
    payloadHash: "1c097e0e460981c6b92ba50ed349754b87c5f051c521fb97d8bd23ae6a3481a1",
    generatorPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
    blockSignature:
        "3044022025909a9b8303115bb93f8ca0ef6c1d420f9d9e63dab653fd428b3c9ffd435ee302206f8c515d00f05a921060600403c5a88e64e6397ba2fa71c49ce6270b2b27d198",
    previousBlockHex: "2b324b8b33a85802",
    idHex: "e5636ec8a39d6e5a",
    transactions: [
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13914,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1300000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "3044022009b560146aefc78a5a793a2baf248fedf72f72c81808437df229d9e4b4b047b602203e4a0eb3a2b08eee0efbbcbb6a271dd369447c7ed10f64ee766bf47910191df5",
            vendorField: "Test Transaction 1",
            id: "19de976f546a59067b71e8230d4c4a891b3c096031a44dd91a34266cf247f85b",
            blockId: "16529176865397370458",
            sequence: 0,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13912,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1800000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "304402201861432b9bd22601dc066420f2c1c65510dad69516f87881d43d5f15d2a1e29402203d8757c5df596709f700dc22797b0224bee1335dbb67da8eb180d3a87fe334cf",
            vendorField: "Test Transaction 1",
            id: "1a788caca9191da839238402f09c56f5ad51b549c975be57aafd6ec6cb4d3290",
            blockId: "16529176865397370458",
            sequence: 1,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13912,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1400000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "30440220292d5086b0dae6c704c8c8bca52ae85d3935146b3b14c8ec371af49df2e00eda0220293483907d52011bfb528639f0507ff88cd784a91c7a4fc4a75d25e42ce9ca18",
            vendorField: "Test Transaction 1",
            id: "3fb91678964bc8fddec7a71d90ce8cded13c21e5c07d2d9990e39d8b7f99927e",
            blockId: "16529176865397370458",
            sequence: 2,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13912,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1500000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "30440220134c058997a90bfc9fd9437b4dec74aa3aa0cd7e37b601d9b481f7fc53936be802206b9b2d6a4d7d7d06244c3b7815b8c346851c6ba617eb1def378e07d03af42326",
            vendorField: "Test Transaction 1",
            id: "cfdefa68092a04ff5b9d7379f4fe0987fc228594c02b7085fdf19b78fc86d3f4",
            blockId: "16529176865397370458",
            sequence: 3,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13912,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1200000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "30450221009fb1da6b91ff46c6b23bab42c628c54d4cc8b7812268c8ce7be4b828f6dc46dc0220762cb711716287fb77efc08acb4b56cb50542f163e14c0aa7ba8ee95a839c65c",
            vendorField: "Test Transaction 1",
            id: "d2581e0a729e4955ba843f757334d7714993fb2bd0a5d54cb3f62f94ca8a7c49",
            blockId: "16529176865397370458",
            sequence: 4,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13912,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1600000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "304402202892297a5392d2499cbbf2828d7045e4f417a102ed649a32aa95ffde4454d1ce02205a038c9011f4104ff4e64bed81cba40d41c091feda5b9ad5c95af0f1577bcafe",
            vendorField: "Test Transaction 1",
            id: "f002f273d1df3b1760d350d52729e1baa6e8def8ef029e7c9d47f03a2a707cb2",
            blockId: "16529176865397370458",
            sequence: 5,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 13912,
            senderPublicKey: "0257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b",
            fee: "10000000",
            amount: "1700000000",
            vendorFieldHex: "54657374205472616e73616374696f6e2031",
            expiration: 0,
            recipientId: "DShZWhD5WELYsvvAhigJrxcWFRt65RMJVa",
            signature:
                "304402202c7e77c71c614328cb6ca7a9e7f74a300e2438699495fd033d94a6e9974a28b9022067b85c7291b35eeb47fe5d11dbfd72578049ef6fceeb946d5ab731ffbda8773b",
            vendorField: "Test Transaction 1",
            id: "fe63d60e86b8a17a7199d61c5b48f629ff3e58b729ed86706c50f83aeafac8cf",
            blockId: "16529176865397370458",
            sequence: 6,
        },
    ],
};

export const dummyBlock2 = {
    data: dummyBlock,
    serialized:
        "000000005c35000001db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e00000001c097e0e460981c6b92ba50ed349754b87c5f051c521fb97d8bd23ae6a3481a10257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b3044022025909a9b8303115bb93f8ca0ef6c1d420f9d9e63dab653fd428b3c9ffd435ee302206f8c515d00f05a921060600403c5a88e64e6397ba2fa71c49ce6270b2b27d198",
    serializedFull:
        "000000005c35000001db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e00000001c097e0e460981c6b92ba50ed349754b87c5f051c521fb97d8bd23ae6a3481a10257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b3044022025909a9b8303115bb93f8ca0ef6c1d420f9d9e63dab653fd428b3c9ffd435ee302206f8c515d00f05a921060600403c5a88e64e6397ba2fa71c49ce6270b2b27d198ab000000ab000000ab000000ab000000ac000000ab000000ab000000ff011e005a3600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e2031006d7c4d00000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f3044022009b560146aefc78a5a793a2baf248fedf72f72c81808437df229d9e4b4b047b602203e4a0eb3a2b08eee0efbbcbb6a271dd369447c7ed10f64ee766bf47910191df5ff011e00583600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e203100d2496b00000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f304402201861432b9bd22601dc066420f2c1c65510dad69516f87881d43d5f15d2a1e29402203d8757c5df596709f700dc22797b0224bee1335dbb67da8eb180d3a87fe334cfff011e00583600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e2031004e725300000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f30440220292d5086b0dae6c704c8c8bca52ae85d3935146b3b14c8ec371af49df2e00eda0220293483907d52011bfb528639f0507ff88cd784a91c7a4fc4a75d25e42ce9ca18ff011e00583600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e2031002f685900000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f30440220134c058997a90bfc9fd9437b4dec74aa3aa0cd7e37b601d9b481f7fc53936be802206b9b2d6a4d7d7d06244c3b7815b8c346851c6ba617eb1def378e07d03af42326ff011e00583600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e2031008c864700000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f30450221009fb1da6b91ff46c6b23bab42c628c54d4cc8b7812268c8ce7be4b828f6dc46dc0220762cb711716287fb77efc08acb4b56cb50542f163e14c0aa7ba8ee95a839c65cff011e00583600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e203100105e5f00000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f304402202892297a5392d2499cbbf2828d7045e4f417a102ed649a32aa95ffde4454d1ce02205a038c9011f4104ff4e64bed81cba40d41c091feda5b9ad5c95af0f1577bcafeff011e00583600000257dced1034ba1567b664957bfd71c3de94fa32a0777d94af22334e221b23073b80969800000000001254657374205472616e73616374696f6e203100f1536500000000000000001eec7e77db1122710e23c8d6f3c9ad5a39bca5fb6f304402202c7e77c71c614328cb6ca7a9e7f74a300e2438699495fd033d94a6e9974a28b9022067b85c7291b35eeb47fe5d11dbfd72578049ef6fceeb946d5ab731ffbda8773b",
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
