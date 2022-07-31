const e = require("express");
const net = require("net");
const server = net.createServer();
const serverPort = 1515;

//IchigoJamから送られてくるエラーコードに対する処理
const ichigojam_errors = [ 
    "Syntax%20error%0A", "Line%20error%0A", "Illegal%20argument%0A",
    "Divide%20by%20zero%0A", "Index%20out%20of%20range%0A", "File%20error%0A",
    "Not%20match%0A", "Stack%20over%0A", "Complex%20expression%0A",
    "Out%20of%20memory%0A", "Too%20long%0A", "Break%0A", "OK%0A"
]

const checkError = (data) => {
    let errorCode = "not error";
    let dataUri = encodeURI(data);
    for(let i in ichigojam_errors){
        if(dataUri == ichigojam_errors[i]) errorCode = "error";
    }
    return errorCode;
}


//クライアント情報
let clients = [];
let signUp_IPaddress = "";
let ichigojam_IPaddresses = []; 
let ichigojam_num = 0;

let checkAddress = (signUp_IPaddress) =>  {
    let checkedResult = {};
    let others = [];

    for(let i in ichigojam_IPaddresses){
        if(signUp_IPaddress == ichigojam_IPaddresses[i]){
            checkedResult.result = "already";
        }else {
            others.push(i);
        }
    }
    checkedResult.others = others;
    return checkedResult;
}

//TCPサーバーとクライアントとの通信処理
server.on("connection",(socket) => {
    
    //接続を試みるクライアントの処理
    signUp_IPaddress = socket.remoteAddress.split(":")[3];

    if(checkAddress(signUp_IPaddress).result == "already"){
        console.log("already connected...");
        socket.write("'already connected...\n");
    }
    else {
        clients.push(socket);
        ichigojam_IPaddresses.push(socket.remoteAddress.split(":")[3]); //IchigoJamのIPアドレス登録
        ichigojam_num = clients.indexOf(socket); //IchigoJamを識別する番号の取得
            console.log("\n- ichigojam[" + ichigojam_num + "]/" + ichigojam_IPaddresses[ichigojam_num] + " : connected.\n");
        clients[ichigojam_num].write("'you are No." + ichigojam_num + " IchigoJam.\n");
            console.log(ichigojam_IPaddresses);
    }

    //クライアントからデータ取得時
    socket.on("data",(data) => {
        let DATA = data.toString();
        let ichigojam_num = clients.indexOf(socket);
        if(checkError(DATA) == "not error"){
            let checked = checkAddress(socket.remoteAddress.split(":")[3])
            //データ送信者以外にデータを送る
            for(let i in ichigojam_IPaddresses){
                let other = checked.others[i];
                if(other)clients[other].write(DATA + "\n");
            }
            //データ送信者の内容を出力
            console.log("ichigojam[" + ichigojam_num + "]/" + ichigojam_IPaddresses[ichigojam_num] +" > " + DATA);
        }
    })

    //ホストコンピューター（コマンドライン）からデータ送信
    process.stdin.resume();

    process.stdin.on("data",(data) => {
        for(let i in ichigojam_IPaddresses){
            clients[i].write(data);
        }
    });

    //TCP切断時
	socket.on("close", () => {

    })

    //接続エラー時
	socket.on("error", (err) => {
		console.log("Error > " + socket.remoteAddress.split[3] + ":" + socket.remotePort);
        console.log("セションが切断されました");
        socket.write("'connection error.\n");
	});
})

server.listen(serverPort, () => {
    console.log("tcp server listening on " + serverPort);
})