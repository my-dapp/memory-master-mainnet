var dappAddress = "n1pwzcrZZeFjTeHE2DhnpJe4wHtPvRq9zKP"; // mainnet

var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb();

var HttpRequest = nebulas.HttpRequest;

neb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));
//neb.setRequest(new HttpRequest("https://testnet.nebulas.io"));
//neb.setRequest(new HttpRequest("http://127.0.0.1:8685"));

var NebPay = require("nebpay")
var nebPay = new NebPay();

var serialNumber;
var callbackUrl = NebPay.config.mainnetUrl;   //如果合约在主网,则使用这个
//var callbackUrl = NebPay.config.testnetUrl;
//var callbackUrl = "http://127.0.0.1:8685";

/**
 * 提交分数
 * @param name
 * @param time
 */
function save(name, time){
    $(".layer").fadeIn(400);
    var to = dappAddress;
    var value = "0";
    var callFunction = "save";
    var callArgs = "[\"" + name + "\",\"" + time + "\"]";

    serialNumber = nebPay.call(to, value, callFunction, callArgs, {    //使用nebpay的call接口去调用合约,
        listener: saveResult,       //设置listener, 处理交易返回信息
        callback: callbackUrl
    });

    intervalQuery = setInterval(function () {
        funcIntervalQuery();
    }, 10000);
}

var intervalQuery;

function funcIntervalQuery() {
    var options = {
        callback: callbackUrl
    };
    nebPay.queryPayInfo(serialNumber,options)   //search transaction result from server (result upload to server by app)
        .then(function (resp) {
            console.log("tx result: " + resp);  //resp is a JSON string
            var respObject = JSON.parse(resp);
            if(respObject.code === 0 && respObject.data.status === 1) {
                clearInterval(intervalQuery);
                clearInterval(timer);
                $(".layer").fadeOut(400);
                getRank(resp);
            }
        })
        .catch(function (err) {
            console.log(err);
        });
}


function saveResult(res) {
    var resStr = JSON.stringify(res);
    console.log("return of rpc call resp: " + resStr);
    if (res) {
        // 取消交易
        if (resStr.search(/Transaction rejected by user/i) > 0) {
            $(".layer").fadeOut(400);
            clearInterval(intervalQuery);
            return;
        }
        var txhash = res.txhash;
        if(txhash) {
            testTransitionStatus(txhash, function () {
                clearInterval(timer)
                clearInterval(intervalQuery);
                //$(".layer").fadeOut(400);
                getRank(res);
            });
        }
    }
}

var timer;

function testTransitionStatus(txhash, callback){
    timer = setInterval(function(){
        try {
            neb.api.getTransactionReceipt({hash: txhash}).then(function (res) {
                if (res.status === 1) {
                    if (callback) {
                        callback()
                    }
                    return;
                }
            }).catch(function (err) {
                console.log(err);
            });
        } catch (e) {

        }
    },3000)
}


/**
 * 获取榜单
 */
function getRank() {

    var from = Account.NewAccount().getAddressString();
    var value = "0";
    var nonce = "0";
    var gas_price = "1000000";
    var gas_limit = "2000000";
    var callArgs = "[\"\"]";
    var callFunction = "getRank";
    var contract = {
        "function": callFunction,
        "args": callArgs
    };

    neb.api.call(from,dappAddress,value,nonce,gas_price,gas_limit,contract).then(function (resp) {
        rankResult(resp);
    }).catch(function (err) {
        console.log("error:" + err.message);
    });

}

/**
 * 排行榜
 * @param res
 */
function rankResult(res) {
    $(".layer").fadeOut(400);
    if(res){
        console.log(res);
        try {
            var rankpage = '<div class="rank-page animated bounceInDown">\n' +
                        '        <table>\n' +
                        '            <thead>\n' +
                        '            <tr>\n' +
                        '                <th>排名</th>\n' +
                        '                <th>昵称</th>\n' +
                        '                <th>用时(s)</th>\n' +
                        '            </tr>\n' +
                        '            </thead>\n' +
                        '            <tbody>';

            if (res.result !== null) {
                var array = JSON.parse(res.result);

                if (Array.isArray(array) && array.length > 0) {
                    for (var i = 0; i < array.length; i++) {
                        var obj = array[i];
                        console.log("obj = " + obj);
                        rankpage += '<tr>\n' +
                            '                <td class="bg">' + (i + 1) + '</td>\n' +
                            '                <td>' + obj.name + '</td>\n' +
                            '                <td>' + obj.time + '</td>\n' +
                            '            </tr>';
                    }
                }
            }
            rankpage += '</tbody>\n' +
                        '        </table>\n' +
                        '        <a class="again" href="index.html">我要上榜</a>' +
                        '    </div>';
            $("#whole-wrap").html(rankpage);
        } catch (err) {
            console.log("err: " + err);
        }
    }
}

