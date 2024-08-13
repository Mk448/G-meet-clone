const express = require('express');
const path = require("path");
var app = express();
var server = app.listen(process.env.PORT || 3000, function () {
    console.log("Listening to PORT 3000");
});
const fs = require('fs');
const fileUpload = require('express-fileupload');
const io = require("socket.io")(server, {
    allowEI03: true,   // false by default
});
app.use(express.static(path.join(__dirname,"")));
var userConnections = [];
var hostInfo = [];
io.on("connection",(socket) => {
    console.log("socket id is ", socket.id);

async function userConnect(data){
    var existingUser = userConnection.find(
        (p) => p.meeting_id == data.meetingids && p.connectionIds === data.connectionIds
    );
    if(!existingUser){
        userConnections.push({
            ConnectionId: data.connectionIds,
            user_id: data.displayNames,
            meeting_id: data.meetingid,
        });
    }

    var other_users = userConnections.filter(
        (p) => p.meeting_id == data.meetingid && p.connectionId !== data.connectionIds
    );
   
   
        var userCount = userConnections.length;
        console.log(userCount);

        socket.to(data.ConnectionIds).emit("inform_me_about_other_user", other_users);

        
        other_users.forEach((v) => {
            try{
                io.to(v.connectionId).emit("inform_other_about_me", {
                    other_user_id: data.displayName,
                    connId: data.connectionIds,
                    userNumber: userCount,
                });
            }catch(error){
                console.log("Error in emit: ", error)
            }
            
        })

        
}    


    socket.on("askToConnect", (data) => {
        const isMeetingExist = userConnections.find((info)=>info.meeting_id === data.neetingid);
        if(isMeetingExist){
            const isHostForMeeting = hostInfo.find((info)=>info.meeting_id === data.meetingid);
            socket.io(isHostForMeeting.connectionid).emit("request_join_permission",{
                displayNames: data.displayName,
                meetingids: data.meetingid,
                connectionIds: socket.id,
                host: true
            })
        }else{
            hostInfo.push({
                connectionId: socket.id,
                user_id: data.displayName,
                meeting_id: data.meetingId,
                host: true
            })
            var datt = {
                displayNames: data.displayName,
                meetingids: data.meetingid,
                connectionIds: socket.id,
                host: true
            }
            try{
                userConnections(datt);
            } catch {
                console.log("error is :", error);
            }
        }
        
    })

    socket.on("grant_join_permission", (dat) => {
        if(dat.permissionGranted){
            userConnect(dat.data)
        }else{
            socket.to(dat.data.connectionId).emit("permission_denied");
            socket.disconnect()
        }
    })


    socket.on("userconnect", (data) => {
        console.log("userconnect", data.displayName, data.meetingid);
        console.log("other_users is: ", other_users);
        var other_users = userConnections.filter((p) => p.meeting_id == data.meetingid)
        userConnections.push({
            connectionId: socket.id,
            user_id: data.displayName,
            meeting_id: data.meetingid,
        });
        var userCount = userConnections.length;
        console.log(userCount);
        other_users.forEach((v) => {
            socket.to(v.connectionId).emit("inform_other_about_me", {
                other_user_id: data.displayName,
                connId: socket.id,
                userNumber: userCount
            })
        })

        socket.emit("inform_me_about_other_user", other_users);
    });
    socket.on("SDPProcess", (data) => {
        socket.to(data.to_connid).emit("SDPProcess",{
            message: data.message,
            from_connid: socket.id,
        });
    });

    socket.on("sendMessage", (msg) =>{
        console.log(msg);
        var mUser = userConnection.find((e) => p.connectionId == socket.id);
        if(muser){
            var meetingId = mUser.meeting_id;
            var from = mUser.user_id;
            var list = userConnections.filter((p)=>p.meeting_id == meetingid)
            list.forEach((v)=>{
                socket.to(v.connectionId).emit("showChatMessage", {
                    from:from,
                    message:msg
                })
            })
        }
    });

    socket.on("fileTransferToOther", (msg) =>{
        console.log(msg);
        var mUser = userConnection.find((e) => p.connectionId == socket.id);
        if(muser){
            var meetingId = mUser.meeting_id;
            var from = mUser.user_id;
            var list = userConnections.filter((p)=>p.meeting_id == meetingid)
            list.forEach((v)=>{
                socket.to(v.connectionId).emit("showFileMessage", {
                  username: msg.username,
                  meetingid: msg.meetingid,
                  filePath: msg.filePath,
                  fileName: msg.fileName,
                });
            });
        }
    });

   

    socket.on("disconnect", function(){
        console.log("Disconnected");
        var disUser = userConnections.find((p) => p.connectionId == socket.id);
        if(disUser){
            var meetingId = disUser.meeting_id;
            userConnections.filter((e) =>p.connectionId != socket.id);
            var list = userConnections.filter((p) => p.meeting_id == meetingId)
            list.forEach((v) => {
                var userNumberAfUserLeave = userConnections.length;
                socket.to(v.connectionId).emit("inform_other_about_disconnected_user", {
                    connId: socket.id,
                    uNumber: userNumberAfUserLeave
                });
            });
        }
    })

    socket.on("sendHandRaise", function(){
        
        var senderInfo = userConnections.find((p) => p.connectionId == socket.id);
        console.log("senderInfo: ", senderInfo);
        if(senderInfo){
            var meetingId = senderInfo.meeting_id;
           // userConnections.filter((e) =>p.connectionId != socket.id);
            var list = userConnections.filter((p) => p.meeting_id == meetingId)
            list.forEach((v) => {
                var userNumberAfUserLeave = userConnections.length;
                socket.to(v.connectionId).emit("HandRaise_info_for_others", {
                    connId: socket.id,
                    handRaise:data
                });
            });
        }
    })
});
app.use(fileUpload());
app.post("attachimg", function(req, res){
    var data = req.body;
    var imageFile = req.files.zipfile;
    console.log(imageFile);
    var dir = "public/attachment/"+data.meeting_id+"/";
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    imageFile.mv("public/attachment"+data.meeting_id+"/"+imageFile.name, function(error){
        if(error){
            console.log("couldn't upload the inage file, error: ", error);
        } else {
            console.log("Image file successfully uploaded");
        }
    })
})