import net from "net";
import { WebSocket, WebSocketServer } from "ws";

interface VehicleData {
  battery_temperature: number;
  timestamp: number;
}

const TCP_PORT = 12000;
const WS_PORT = 8080;
const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: WS_PORT });

let temp_checker: VehicleData[] = [];
let count = 0;

tcpServer.on("connection", (socket) => {
  console.log("TCP client connected");

  socket.on("data", (msg) => {
    console.log(`Received: ${msg.toString()}`);

    let jsonData: VehicleData;

    try {
      jsonData = JSON.parse(msg.toString());
    } catch (error) {
      const msg_fix = msg.toString().slice(0, -1);
      jsonData = JSON.parse(msg_fix);
    }

    if(temp_checker.length >= 5) {
      for(let i = 0; i < temp_checker.length; i++) {
        if(temp_checker[i].battery_temperature < 20 || temp_checker[i].battery_temperature > 80) {
          count ++;
        }
      }
      if(count >= 3) {
        console.log(`ERROR: Unsafe battery temperatures reached at: ${jsonData.timestamp}`);
      }
      temp_checker.shift();
      count = 0;
    }
  
    temp_checker.push(jsonData);
  
//    console.log(temp_checker);
//    console.log(temp_checker[3]);
//    console.log(temp_checker[3].battery_temperature);
//    console.log(jsonData);
//    console.log(jsonData.battery_temperature);


    // Send JSON over WS to frontend clients
    websocketServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    });
  });

  socket.on("end", () => {
    console.log("Closing connection with the TCP client");
  });

  socket.on("error", (err) => {
    console.log("TCP client error: ", err);
  });
});

websocketServer.on("listening", () =>
  console.log(`Websocket server started on port ${WS_PORT}`)
);

websocketServer.on("connection", async (ws: WebSocket) => {
  console.log("Frontend websocket client connected");
  ws.on("error", console.error);
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP server listening on port ${TCP_PORT}`);
});
